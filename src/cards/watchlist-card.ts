/**
 * Watchlist card adapter — CardModule wrapper for the watchlist view.
 *
 * Renders a loading placeholder immediately; the main app wires real data
 * after provider hydration via the `update` hook.
 */
import type { CardModule } from "./registry";
import { patchDOM } from "../core/patch-dom";

const watchlistCard: CardModule = {
  mount(container, _ctx) {
    patchDOM(container, `<p class="empty-state">Loading watchlist…</p>`);
    return {
      update(_ctx): void {
        // Real data binding is handled by main.ts after provider fetch.
      },
    };
  },
};

export default watchlistCard;
