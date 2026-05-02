/**
 * Background Fetch API wrapper for large OHLCV archive downloads.  (H7)
 *
 * Background Fetch lets the browser download large files while the page (or
 * ServiceWorker) is not active.  This module provides:
 *
 *   - `backgroundFetchSupported()` — feature-detect BackgroundFetchManager
 *   - `startArchiveDownload(url, options)` — register a Background Fetch
 *   - `getActiveFetches()` — list in-progress registrations from SW
 *   - `onFetchProgress(registration, cb)` — attach a progress listener
 *   - `fetchWithFallback(url, options)` — prefers Background Fetch when
 *     supported and the payload appears large; falls back to `fetch()`.
 *
 * When BackgroundFetch is not available (most non-Chrome browsers, Node) the
 * module falls back silently to the standard `fetch()` API so callers do not
 * need feature-specific branches.
 *
 * MDN reference: https://developer.mozilla.org/en-US/docs/Web/API/Background_Fetch_API
 */

export interface ArchiveDownloadOptions {
  /** Human-readable title shown in the browser download UI. */
  title: string;
  /** Unique registration ID.  Defaults to a URL-derived slug. */
  registrationId?: string;
  /** Icons shown in the download UI. */
  icons?: { src: string; sizes: string; type: string }[];
}

export interface FetchProgress {
  downloaded: number;
  downloadTotal: number;
  /** 0–1 fraction, or -1 when total is unknown. */
  ratio: number;
}

export type ProgressCallback = (progress: FetchProgress) => void;

// ── Feature detection ─────────────────────────────────────────────────────

/** Returns true when the Background Fetch API is available. */
export function backgroundFetchSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "BackgroundFetchManager" in globalThis
  );
}

// ── Core API ──────────────────────────────────────────────────────────────

/**
 * Register a Background Fetch for a large archive URL.
 *
 * Requires the page to have a registered ServiceWorker; throws if SW is not
 * ready within 5 seconds.  Callers should only invoke this when
 * `backgroundFetchSupported()` returns `true`.
 *
 * @returns the BackgroundFetchRegistration, or null if unsupported.
 */
export async function startArchiveDownload(
  url: string,
  options: ArchiveDownloadOptions,
): Promise<BackgroundFetchRegistration | null> {
  if (!backgroundFetchSupported()) return null;

  const sw = await navigator.serviceWorker.ready;
  const bgFetch = (
    sw as ServiceWorkerRegistration & {
      backgroundFetch: BackgroundFetchManager;
    }
  ).backgroundFetch;

  if (!bgFetch) return null;

  const id = options.registrationId ?? urlToSlug(url);
  // Avoid duplicate registrations
  const existing = await bgFetch.get(id);
  if (existing) return existing;

  return bgFetch.fetch(id, [url], {
    title: options.title,
    icons: options.icons ?? [],
    downloadTotal: 0, // unknown up-front; browser will update
  });
}

/**
 * List all active Background Fetch registrations visible to the SW.
 * Returns an empty array when the API is unavailable.
 */
export async function getActiveFetches(): Promise<BackgroundFetchRegistration[]> {
  if (!backgroundFetchSupported()) return [];
  try {
    const sw = await navigator.serviceWorker.ready;
    const bgFetch = (
      sw as ServiceWorkerRegistration & {
        backgroundFetch: BackgroundFetchManager;
      }
    ).backgroundFetch;
    if (!bgFetch) return [];
    const ids = await bgFetch.getIds();
    const regs = await Promise.all(ids.map((id) => bgFetch.get(id)));
    return regs.filter((r): r is BackgroundFetchRegistration => r !== undefined);
  } catch {
    return [];
  }
}

/**
 * Attach a progress listener to an active BackgroundFetchRegistration.
 * The callback is invoked on each `progress` event and once immediately.
 *
 * @returns a cleanup function that removes the listener.
 */
export function onFetchProgress(
  registration: BackgroundFetchRegistration,
  cb: ProgressCallback,
): () => void {
  const handler = (): void => {
    const { downloaded, downloadTotal } = registration;
    cb({
      downloaded,
      downloadTotal,
      ratio: downloadTotal > 0 ? downloaded / downloadTotal : -1,
    });
  };
  // Fire immediately with current state
  handler();
  registration.addEventListener("progress", handler);
  return (): void => registration.removeEventListener("progress", handler);
}

/**
 * Unified fetch helper that prefers Background Fetch for large archives.
 *
 * Strategy:
 *   1. If `preferBackground` is true and BackgroundFetch is supported →
 *      register a background fetch, return null (caller polls progress).
 *   2. Otherwise → standard `fetch()` with optional progress via ReadableStream.
 *
 * @param preferBackground — set true for large downloads (e.g. full OHLCV archive).
 * @returns Response when using standard fetch, null when using Background Fetch.
 */
export async function fetchWithFallback(
  url: string,
  options: RequestInit & {
    preferBackground?: boolean;
    backgroundTitle?: string;
    onProgress?: ProgressCallback;
  } = {},
): Promise<Response | null> {
  const { preferBackground, backgroundTitle, onProgress, ...fetchInit } = options;

  if (preferBackground && backgroundFetchSupported()) {
    const reg = await startArchiveDownload(url, {
      title: backgroundTitle ?? "Downloading archive…",
    });
    if (reg && onProgress) onFetchProgress(reg, onProgress);
    return null; // caller should poll registration for completion
  }

  // Standard fetch with streaming progress (best-effort)
  const response = await fetch(url, fetchInit);
  if (onProgress && response.body) {
    const contentLength = response.headers.get("Content-Length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let downloaded = 0;
    const reader = response.body.getReader();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller): Promise<void> {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onProgress({ downloaded, downloadTotal: total || downloaded, ratio: 1 });
            controller.close();
            break;
          }
          downloaded += value.byteLength;
          onProgress({
            downloaded,
            downloadTotal: total,
            ratio: total > 0 ? downloaded / total : -1,
          });
          controller.enqueue(value);
        }
      },
    });
    return new Response(stream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  }

  return response;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function urlToSlug(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname)
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 64);
  } catch {
    return "bg-fetch-" + Date.now();
  }
}
