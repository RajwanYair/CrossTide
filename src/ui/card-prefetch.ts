/**
 * Card prefetch on intent — eagerly loads card chunks when user hovers or
 * focuses navigation links.
 *
 * H3: Reduces perceived latency by preloading the card module before
 * the user actually clicks.
 */

import { loadCard } from "../cards/registry";
import type { RouteName } from "./router";

const prefetchedCards = new Set<RouteName>();

export function initCardPrefetchOnIntent(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>("#app-nav .nav-link[data-route]");
  links.forEach((link) => {
    const route = link.dataset["route"] as RouteName | undefined;
    if (!route) return;
    const prefetch = (): void => {
      if (prefetchedCards.has(route)) return;
      prefetchedCards.add(route);
      void loadCard(route).catch(() => {
        // Keep intent prefetch best-effort; navigation path handles real errors.
      });
    };
    link.addEventListener("mouseenter", prefetch, { passive: true });
    link.addEventListener("focus", prefetch, { passive: true });
  });
}
