/**
 * Cross-Tab Share (B11) — combines `broadcast-channel.ts` + `share-state.ts`
 * so that when one tab calls `broadcastShareState(state)`, all other open
 * CrossTide tabs receive and apply it.
 *
 * Usage:
 *   const sync = createCrossTabShareSync();
 *   sync.onShareState((state) => applyShareState(state));
 *   sync.broadcastShareState({ symbol: "AAPL", range: "1y" });
 *   sync.destroy();
 */

import { createCrossTabSync, type CrossTabSync } from "./broadcast-channel";
import type { ShareState } from "./share-state";

const SHARE_CHANNEL_NAME = "crosstide-share-sync";

export interface CrossTabShareSync {
  /**
   * Register a callback invoked when another tab broadcasts a share-state.
   * Returns an unsubscribe function.
   */
  onShareState(handler: (state: ShareState) => void): () => void;

  /**
   * Broadcast the given share-state to all other open tabs.
   */
  broadcastShareState(state: ShareState): void;

  /** Close the underlying BroadcastChannel and release all listeners. */
  destroy(): void;
}

/**
 * Create a cross-tab share sync instance.
 * Wraps `createCrossTabSync` with ShareState-typed helpers.
 */
export function createCrossTabShareSync(): CrossTabShareSync {
  const sync: CrossTabSync = createCrossTabSync(SHARE_CHANNEL_NAME);

  return {
    onShareState(handler: (state: ShareState) => void): () => void {
      return sync.onConfigChange((raw: unknown) => {
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          handler(raw);
        }
      });
    },

    broadcastShareState(state: ShareState): void {
      sync.broadcastConfig(state);
    },

    destroy(): void {
      sync.destroy();
    },
  };
}
