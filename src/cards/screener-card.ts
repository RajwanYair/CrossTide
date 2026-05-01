/**
 * Screener card adapter — CardModule wrapper for the stock screener.
 *
 * Placeholder mount; full implementation in Sprint 7 (A13).
 */
import type { CardModule } from "./registry";

const screenerCard: CardModule = {
  mount(container, _ctx) {
    container.innerHTML = `<p class="empty-state">Screener — coming soon.</p>`;
    return {};
  },
};

export default screenerCard;
