/** Worker-first routing policy shared by Vite configuration and runtime clients. */

export const DEFAULT_WORKER_BASE_URL = "https://worker.crosstide.pages.dev";
export const DEV_WORKER_BASE_URL = "/api/worker";

/** Select the Worker base URL for a build environment. */
export function getConfiguredWorkerBaseUrl(
  configuredUrl: string | undefined,
  isCi: boolean,
): string {
  const explicitUrl = configuredUrl?.trim();
  if (explicitUrl) return explicitUrl;
  return isCi ? DEFAULT_WORKER_BASE_URL : DEV_WORKER_BASE_URL;
}

/** Resolve a relative Worker base against the current browser origin. */
export function resolveWorkerBaseUrl(base: string, origin?: string): string {
  if (/^https?:\/\//i.test(base)) return base;
  if (origin) return new URL(base, origin).toString();
  return base;
}
