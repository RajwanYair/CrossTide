/**
 * Web Push infrastructure — subscribe, unsubscribe, and show local notifications.
 *
 * Design:
 *  - `isPushSupported()` guards all calls
 *  - `subscribeToPush(publicKey)` uses PushManager.subscribe() and returns the
 *    serialized PushSubscription for server-side storage
 *  - `unsubscribePush()` removes the existing subscription
 *  - `showLocalNotification(title, opts)` forwards to the active SW registration
 *  - VAPID public key is supplied by the caller so this module stays key-agnostic
 *  - All errors are returned as Result<T> to avoid unhandled promise rejections
 */

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// ──────────────────────────────────────────────────────────────
// Feature detection
// ──────────────────────────────────────────────────────────────

/** Returns true when the browser has everything needed for Web Push. */
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in self &&
    "Notification" in self
  );
}

// ──────────────────────────────────────────────────────────────
// Subscribe
// ──────────────────────────────────────────────────────────────

/**
 * Subscribe to push notifications using the given VAPID public key.
 * Requests Notification permission if not already granted.
 * Returns the serialized subscription payload or an error string.
 */
export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<{ ok: true; value: PushSubscriptionPayload } | { ok: false; error: string }> {
  if (!isPushSupported()) {
    return { ok: false, error: "Push not supported in this browser" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: `Notification permission ${permission}` };
  }

  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.ready;
  } catch (err) {
    return { ok: false, error: `SW not ready: ${String(err)}` };
  }

  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast to satisfy the Uint8Array<ArrayBuffer> constraint in the WebAuthn API types
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
    });
  } catch (err) {
    return { ok: false, error: `subscribe failed: ${String(err)}` };
  }

  const rawKey = sub.getKey("p256dh");
  const rawAuth = sub.getKey("auth");
  if (!rawKey || !rawAuth) {
    return { ok: false, error: "Missing p256dh or auth keys in subscription" };
  }

  return {
    ok: true,
    value: {
      endpoint: sub.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(rawKey),
        auth: arrayBufferToBase64(rawAuth),
      },
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Unsubscribe
// ──────────────────────────────────────────────────────────────

/** Remove any existing push subscription. Returns true when successfully removed. */
export async function unsubscribePush(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (!isPushSupported()) {
    return { ok: false, error: "Push not supported" };
  }

  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.ready;
  } catch (err) {
    return { ok: false, error: `SW not ready: ${String(err)}` };
  }

  let sub: PushSubscription | null;
  try {
    sub = await reg.pushManager.getSubscription();
  } catch (err) {
    return { ok: false, error: `getSubscription failed: ${String(err)}` };
  }

  if (!sub) return { ok: true };

  try {
    await sub.unsubscribe();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `unsubscribe failed: ${String(err)}` };
  }
}

// ──────────────────────────────────────────────────────────────
// Local notification
// ──────────────────────────────────────────────────────────────

export interface LocalNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: unknown;
}

/**
 * Show a notification via the active Service Worker registration.
 * Falls back to a plain `Notification` constructor when SW registration
 * is unavailable (e.g. during tests or in a non-SW context).
 */
export async function showLocalNotification(
  title: string,
  opts: LocalNotificationOptions = {},
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!("Notification" in self)) {
    return { ok: false, error: "Notifications not supported" };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, error: "Notification permission not granted" };
  }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, opts);
    } else {
      // Non-SW context — best-effort; omit undefined fields (exactOptionalPropertyTypes)
      const notifOpts: NotificationOptions = {};
      if (opts.body !== undefined) notifOpts.body = opts.body;
      if (opts.icon !== undefined) notifOpts.icon = opts.icon;
      if (opts.tag !== undefined) notifOpts.tag = opts.tag;
      new Notification(title, notifOpts);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Convert a URL-safe base64 string to a Uint8Array (for VAPID application server key). */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Convert an ArrayBuffer to a URL-safe base64 string. */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
