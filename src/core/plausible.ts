/**
 * Plausible analytics integration — privacy-respecting usage tracking.
 *
 * R14: Plausible is cookie-free, GDPR-compliant, and self-hostable.
 * - Script loads from plausible.io CDN (1 KB, async)
 * - No personal data collected; only aggregate page views and events
 * - Respects Do Not Track (DNT) header
 * - Disabled in development and preview environments
 * - Custom events for key user interactions
 *
 * Dashboard: https://plausible.io/crosstide.pages.dev
 */

const PLAUSIBLE_DOMAIN = "crosstide.pages.dev";
const PLAUSIBLE_SCRIPT = "https://plausible.io/js/script.js";

/**
 * Check if analytics should be enabled.
 * Disabled in dev, localhost, preview deployments, and when DNT is set.
 */
function shouldEnable(): boolean {
  if (typeof window === "undefined") return false;

  const { hostname } = window.location;

  // Disabled in development
  if (hostname === "localhost" || hostname === "127.0.0.1") return false;

  // Disabled in preview deployments (*.preview.pages.dev)
  if (hostname.includes("preview.pages.dev")) return false;

  // Respect Do Not Track
  if (navigator.doNotTrack === "1") return false;

  return true;
}

/**
 * Inject the Plausible analytics script into the document head.
 * No-op if analytics should not be enabled.
 */
export function initPlausible(): void {
  if (!shouldEnable()) return;

  const script = document.createElement("script");
  script.defer = true;
  script.dataset["domain"] = PLAUSIBLE_DOMAIN;
  script.src = PLAUSIBLE_SCRIPT;
  document.head.appendChild(script);
}

/**
 * Send a custom event to Plausible.
 * Used to track key user interactions without any personal data.
 *
 * @example
 *   trackEvent("ticker-search", { query: "AAPL" });
 *   trackEvent("chart-range-change", { range: "1y" });
 */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
  if (!shouldEnable()) return;

  // Plausible exposes window.plausible after script loads
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  if (typeof plausible === "function") {
    plausible(name, props ? { props } : {});
  }
}

type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

// ── Pre-defined event helpers ─────────────────────────────────────────────────

/** Track a ticker search. */
export function trackSearch(query: string): void {
  trackEvent("search", { query });
}

/** Track a chart range change. */
export function trackChartRange(range: string): void {
  trackEvent("chart-range", { range });
}

/** Track a card view. */
export function trackCardView(card: string): void {
  trackEvent("card-view", { card });
}

/** Track a theme change. */
export function trackThemeChange(theme: string): void {
  trackEvent("theme-change", { theme });
}

/** Track passkey registration. */
export function trackPasskeyRegister(): void {
  trackEvent("passkey-register");
}

/** Track an export action. */
export function trackExport(format: string): void {
  trackEvent("export", { format });
}
