/**
 * Hash-based router for single-page navigation.
 */

export type RouteName = "watchlist" | "consensus" | "settings";

const VALID_ROUTES = new Set<RouteName>(["watchlist", "consensus", "settings"]);

export function initRouter(): void {
  window.addEventListener("hashchange", handleRoute);
  handleRoute();
}

function handleRoute(): void {
  const hash = window.location.hash.slice(1) || "watchlist";
  const route = VALID_ROUTES.has(hash as RouteName) ? (hash as RouteName) : "watchlist";
  activateView(route);
}

function activateView(route: RouteName): void {
  // Update nav links
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset["route"] === route);
  });

  // Update views
  document.querySelectorAll<HTMLElement>(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${route}`);
  });
}
