/**
 * Service Worker registration utility.
 */

export async function registerServiceWorker(
  swPath = "/sw.js",
): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register(swPath, { scope: "/" });
    return registration;
  } catch {
    return null;
  }
}
