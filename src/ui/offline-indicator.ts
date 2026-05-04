/**
 * Offline indicator — shows a banner when the app loses network connectivity.
 *
 * Listens to `online`/`offline` events on `window` and renders a fixed banner
 * at the top of the viewport. The banner auto-dismisses when connectivity returns.
 */

const BANNER_ID = "offline-indicator";

let bannerEl: HTMLElement | null = null;

function createBanner(): HTMLElement {
  const el = document.createElement("div");
  el.id = BANNER_ID;
  el.className = "offline-banner";
  el.setAttribute("role", "alert");
  el.setAttribute("aria-live", "assertive");
  el.textContent = "You are offline — data may be stale";
  document.body.prepend(el);
  return el;
}

function showBanner(): void {
  if (bannerEl && document.body.contains(bannerEl)) return;
  bannerEl = createBanner();
}

function hideBanner(): void {
  if (!bannerEl) return;
  bannerEl.classList.add("offline-banner--exit");
  bannerEl.addEventListener(
    "animationend",
    () => {
      bannerEl?.remove();
      bannerEl = null;
    },
    { once: true },
  );
}

/**
 * Initialize offline indicator. Call once at app startup.
 * Returns a dispose function to remove listeners.
 */
export function initOfflineIndicator(): () => void {
  const onOffline = (): void => showBanner();
  const onOnline = (): void => hideBanner();

  window.addEventListener("offline", onOffline);
  window.addEventListener("online", onOnline);

  // Show immediately if already offline
  if (!navigator.onLine) showBanner();

  return () => {
    window.removeEventListener("offline", onOffline);
    window.removeEventListener("online", onOnline);
    bannerEl?.remove();
    bannerEl = null;
  };
}
