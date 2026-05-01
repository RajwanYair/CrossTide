/**
 * Cross-tab synchronization via the BroadcastChannel API.
 *
 * Broadcasts config-change events so all open CrossTide tabs stay in sync
 * without requiring a page reload. Gracefully degrades (no-ops) in
 * environments where BroadcastChannel is unavailable (e.g. some SSR contexts
 * or very old browsers).
 *
 * Usage:
 *   const bc = createCrossTabSync();
 *   bc.onConfigChange((cfg) => applyConfig(cfg));
 *   // …when config changes locally:
 *   bc.broadcastConfig(newConfig);
 *   // cleanup
 *   bc.destroy();
 */

export type CrossTabEventType = "config-change";

export interface CrossTabConfigEvent {
  type: "config-change";
  payload: unknown;
  /** Unique ID of the sender tab — recipients skip their own messages. */
  senderId: string;
}

export type CrossTabMessage = CrossTabConfigEvent;

export interface CrossTabSync {
  /**
   * Register a callback invoked when another tab broadcasts a config change.
   * Returns an unsubscribe function.
   */
  onConfigChange(handler: (cfg: unknown) => void): () => void;

  /** Broadcast the new config to all other open tabs. */
  broadcastConfig(cfg: unknown): void;

  /** Close the BroadcastChannel and release all listeners. */
  destroy(): void;
}

const CHANNEL_NAME = "crosstide-sync";

/** Unique sender ID for this tab instance. */
function makeSenderId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a cross-tab sync object backed by the BroadcastChannel API.
 * If the API is unavailable, returns a safe no-op implementation.
 */
export function createCrossTabSync(): CrossTabSync {
  // Graceful degradation for environments without BroadcastChannel
  if (typeof BroadcastChannel === "undefined") {
    return {
      onConfigChange: (_handler) => () => undefined,
      broadcastConfig: (_cfg) => undefined,
      destroy: () => undefined,
    };
  }

  const senderId = makeSenderId();
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const configHandlers = new Set<(cfg: unknown) => void>();

  channel.addEventListener("message", (ev: MessageEvent<CrossTabMessage>) => {
    const msg = ev.data;
    // Ignore messages from ourselves
    if (!msg || typeof msg !== "object") return;
    if (msg.senderId === senderId) return;

    if (msg.type === "config-change") {
      for (const handler of configHandlers) {
        try {
          handler(msg.payload);
        } catch (err) {
          console.error("[CrossTabSync] config-change handler threw:", err);
        }
      }
    }
  });

  return {
    onConfigChange(handler): () => void {
      configHandlers.add(handler);
      return (): void => {
        configHandlers.delete(handler);
      };
    },

    broadcastConfig(cfg): void {
      const msg: CrossTabConfigEvent = { type: "config-change", payload: cfg, senderId };
      try {
        channel.postMessage(msg);
      } catch (err) {
        // BroadcastChannel.postMessage can throw if the channel is closed
        console.warn("[CrossTabSync] postMessage failed:", err);
      }
    },

    destroy(): void {
      configHandlers.clear();
      channel.close();
    },
  };
}
