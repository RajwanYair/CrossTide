/**
 * PWA install prompt — manages the `beforeinstallprompt` lifecycle event.
 *
 * Captures the deferred prompt when the browser fires it, shows/hides
 * an install button, and handles the user's accept/dismiss response.
 *
 * Spec: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 *
 * Usage:
 *   const install = createPwaInstallManager();
 *   install.onReady(() => showInstallButton());
 *   install.onInstalled(() => hideInstallButton());
 *   btnInstall.addEventListener("click", () => void install.prompt());
 */

const DISMISSED_KEY = "crosstide-pwa-install-dismissed";

export interface PwaInstallManager {
  /** Returns true if the install prompt is available and not dismissed. */
  isAvailable(): boolean;
  /** Trigger the browser's install prompt. Resolves with the user outcome. */
  prompt(): Promise<"accepted" | "dismissed" | "unavailable">;
  /** Register a callback that fires when the prompt becomes available. */
  onReady(cb: () => void): void;
  /** Unregister a callback previously passed to `onReady`. */
  offReady(cb: () => void): void;
  /** Register a callback that fires after successful installation. */
  onInstalled(cb: () => void): void;
  /** Unregister a callback previously passed to `onInstalled`. */
  offInstalled(cb: () => void): void;
  /** Persist the user's dismiss decision (hides button for this device). */
  dismiss(): void;
  /** Whether the user previously dismissed (persisted in localStorage). */
  wasDismissed(): boolean;
  /** Remove event listeners. */
  destroy(): void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function createPwaInstallManager(): PwaInstallManager {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  const readyCbs: Array<() => void> = [];
  const installedCbs: Array<() => void> = [];

  function onBeforeInstallPrompt(e: Event): void {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    if (!wasDismissed()) {
      for (const cb of readyCbs) cb();
    }
  }

  function onAppInstalled(): void {
    deferredPrompt = null;
    for (const cb of installedCbs) cb();
  }

  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);

  function wasDismissed(): boolean {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  }

  return {
    isAvailable(): boolean {
      return deferredPrompt !== null && !wasDismissed();
    },

    async prompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
      if (!deferredPrompt) return "unavailable";

      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      return outcome === "accepted" ? "accepted" : "dismissed";
    },

    onReady(cb: () => void): void {
      readyCbs.push(cb);
    },

    offReady(cb: () => void): void {
      const i = readyCbs.indexOf(cb);
      if (i !== -1) readyCbs.splice(i, 1);
    },

    onInstalled(cb: () => void): void {
      installedCbs.push(cb);
    },

    offInstalled(cb: () => void): void {
      const i = installedCbs.indexOf(cb);
      if (i !== -1) installedCbs.splice(i, 1);
    },

    dismiss(): void {
      try {
        localStorage.setItem(DISMISSED_KEY, "1");
      } catch {
        // localStorage unavailable (e.g. private browsing quota exceeded)
      }
      deferredPrompt = null;
    },

    wasDismissed,

    destroy(): void {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      deferredPrompt = null;
      readyCbs.length = 0;
      installedCbs.length = 0;
    },
  };
}

let _singleton: PwaInstallManager | null = null;

/**
 * A single, page-lifetime `PwaInstallManager` shared across every consumer
 * (the settings card, and any other route that offers an install control).
 * `beforeinstallprompt` fires once per page load, so all consumers must
 * observe the same captured event rather than each registering their own
 * independent listener.
 */
export function getPwaInstallManager(): PwaInstallManager {
  _singleton ??= createPwaInstallManager();
  return _singleton;
}
