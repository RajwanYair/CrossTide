/**
 * WebSocket fan-out channel manager for Durable Objects (H10).
 *
 * Manages named channels where multiple WebSocket-like connections
 * subscribe to receive broadcast messages.  Designed for use inside
 * a Cloudflare Durable Object but injectable for unit testing.
 *
 * Usage:
 *   const mgr = createChannelManager<string>();
 *   mgr.join("AAPL", ws1);
 *   mgr.join("AAPL", ws2);
 *   mgr.broadcast("AAPL", JSON.stringify({ price: 150 }));
 *   mgr.leave("AAPL", ws1);
 */

// ── Types ────────────────────────────────────────────────────────────────

/** Minimal WebSocket-like interface for testability. */
export interface WsLike {
  send(data: string): void;
  readonly readyState: number;
}

export interface ChannelStats {
  readonly channel: string;
  readonly subscribers: number;
}

export interface ManagerStats {
  readonly channels: number;
  readonly totalSubscribers: number;
  readonly perChannel: readonly ChannelStats[];
}

export interface ChannelManager<Meta = unknown> {
  /** Add a connection to a named channel. */
  join(channel: string, ws: WsLike, meta?: Meta): void;
  /** Remove a connection from a named channel. */
  leave(channel: string, ws: WsLike): boolean;
  /** Remove a connection from ALL channels. */
  leaveAll(ws: WsLike): number;
  /** Broadcast a message to all connections in a channel. */
  broadcast(channel: string, data: string, exclude?: WsLike): number;
  /** Broadcast to ALL channels. */
  broadcastAll(data: string, exclude?: WsLike): number;
  /** Get the metadata associated with a connection in a channel. */
  getMeta(channel: string, ws: WsLike): Meta | undefined;
  /** Check if a channel exists and has subscribers. */
  hasChannel(channel: string): boolean;
  /** Number of subscribers in a channel. */
  subscriberCount(channel: string): number;
  /** List all active channel names. */
  channels(): string[];
  /** Drop all closed connections (readyState !== 1). Returns number pruned. */
  prune(): number;
  /** Clear all channels and connections. */
  clear(): void;
  /** Statistics snapshot. */
  stats(): ManagerStats;
}

// ── WebSocket readyState constants ───────────────────────────────────────

export const WS_OPEN = 1;

// ── Implementation ───────────────────────────────────────────────────────

export function createChannelManager<Meta = unknown>(): ChannelManager<Meta> {
  // channel → Set of { ws, meta }
  type Entry = { ws: WsLike; meta?: Meta };
  const channelMap = new Map<string, Set<Entry>>();

  function getOrCreate(channel: string): Set<Entry> {
    let set = channelMap.get(channel);
    if (!set) {
      set = new Set();
      channelMap.set(channel, set);
    }
    return set;
  }

  function findEntry(set: Set<Entry>, ws: WsLike): Entry | undefined {
    for (const e of set) {
      if (e.ws === ws) return e;
    }
    return undefined;
  }

  return {
    join(channel: string, ws: WsLike, meta?: Meta): void {
      const set = getOrCreate(channel);
      // Avoid duplicates
      if (findEntry(set, ws)) return;
      set.add({ ws, meta });
    },

    leave(channel: string, ws: WsLike): boolean {
      const set = channelMap.get(channel);
      if (!set) return false;
      const entry = findEntry(set, ws);
      if (!entry) return false;
      set.delete(entry);
      if (set.size === 0) channelMap.delete(channel);
      return true;
    },

    leaveAll(ws: WsLike): number {
      let count = 0;
      for (const [channel, set] of channelMap) {
        const entry = findEntry(set, ws);
        if (entry) {
          set.delete(entry);
          count++;
          if (set.size === 0) channelMap.delete(channel);
        }
      }
      return count;
    },

    broadcast(channel: string, data: string, exclude?: WsLike): number {
      const set = channelMap.get(channel);
      if (!set) return 0;
      let sent = 0;
      for (const entry of set) {
        if (entry.ws === exclude) continue;
        if (entry.ws.readyState !== WS_OPEN) continue;
        entry.ws.send(data);
        sent++;
      }
      return sent;
    },

    broadcastAll(data: string, exclude?: WsLike): number {
      let total = 0;
      for (const [, set] of channelMap) {
        for (const entry of set) {
          if (entry.ws === exclude) continue;
          if (entry.ws.readyState !== WS_OPEN) continue;
          entry.ws.send(data);
          total++;
        }
      }
      return total;
    },

    getMeta(channel: string, ws: WsLike): Meta | undefined {
      const set = channelMap.get(channel);
      if (!set) return undefined;
      return findEntry(set, ws)?.meta;
    },

    hasChannel(channel: string): boolean {
      const set = channelMap.get(channel);
      return set !== undefined && set.size > 0;
    },

    subscriberCount(channel: string): number {
      return channelMap.get(channel)?.size ?? 0;
    },

    channels(): string[] {
      return Array.from(channelMap.keys());
    },

    prune(): number {
      let pruned = 0;
      for (const [channel, set] of channelMap) {
        for (const entry of set) {
          if (entry.ws.readyState !== WS_OPEN) {
            set.delete(entry);
            pruned++;
          }
        }
        if (set.size === 0) channelMap.delete(channel);
      }
      return pruned;
    },

    clear(): void {
      channelMap.clear();
    },

    stats(): ManagerStats {
      const perChannel: ChannelStats[] = [];
      let totalSubscribers = 0;
      for (const [channel, set] of channelMap) {
        perChannel.push({ channel, subscribers: set.size });
        totalSubscribers += set.size;
      }
      return { channels: channelMap.size, totalSubscribers, perChannel };
    },
  };
}
