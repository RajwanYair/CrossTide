/**
 * Tauri 2.0 desktop integration helpers (H17).
 *
 * Provides detection, IPC bridge, window management, and native
 * feature helpers for running CrossTide as a Tauri desktop app.
 * All Tauri APIs are accessed through the global `__TAURI__` object
 * which is injected by the Tauri runtime — functions gracefully
 * degrade when running in a plain browser.
 *
 * Usage:
 *   if (isTauriEnv()) {
 *     const version = await getAppVersion();
 *     await setWindowTitle(`CrossTide v${version}`);
 *   }
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface TauriInvoke {
  (cmd: string, args?: Record<string, unknown>): Promise<unknown>;
}

export interface TauriEvent {
  listen(event: string, handler: (payload: unknown) => void): Promise<() => void>;
  emit(event: string, payload?: unknown): Promise<void>;
}

export interface WindowOptions {
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
  readonly minWidth?: number;
  readonly minHeight?: number;
  readonly resizable?: boolean;
  readonly fullscreen?: boolean;
  readonly alwaysOnTop?: boolean;
}

export interface AppInfo {
  readonly name: string;
  readonly version: string;
  readonly tauriVersion: string;
  readonly platform: string;
}

export interface TrayAction {
  readonly id: string;
  readonly label: string;
  readonly shortcut?: string;
}

export interface DeepLinkPayload {
  readonly url: string;
  readonly path: string;
  readonly query: Record<string, string>;
}

// ── Detection ────────────────────────────────────────────────────────────

/**
 * Detect if running inside Tauri runtime.
 */
export function isTauriEnv(): boolean {
  return typeof globalThis !== "undefined" && "__TAURI__" in globalThis;
}

/**
 * Get the Tauri invoke function or null if not in Tauri.
 */
export function getTauriInvoke(): TauriInvoke | null {
  if (!isTauriEnv()) return null;
  const tauri = (globalThis as Record<string, unknown>).__TAURI__ as
    | Record<string, unknown>
    | undefined;
  if (!tauri) return null;
  const core = tauri.core as Record<string, unknown> | undefined;
  return (core?.invoke as TauriInvoke) ?? null;
}

// ── Safe wrappers ────────────────────────────────────────────────────────

/**
 * Invoke a Tauri command safely. Returns null if not in Tauri.
 */
export async function safeInvoke<T = unknown>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T | null> {
  const invoke = getTauriInvoke();
  if (!invoke) return null;
  return (await invoke(cmd, args)) as T;
}

/**
 * Get app version from Tauri, or null.
 */
export async function getAppVersion(): Promise<string | null> {
  return safeInvoke<string>("get_app_version");
}

/**
 * Get full app info, or null.
 */
export async function getAppInfo(): Promise<AppInfo | null> {
  return safeInvoke<AppInfo>("get_app_info");
}

// ── Window management ────────────────────────────────────────────────────

/**
 * Set the main window title.
 */
export async function setWindowTitle(title: string): Promise<boolean> {
  const result = await safeInvoke("set_window_title", { title });
  return result !== null;
}

/**
 * Resize the main window.
 */
export async function resizeWindow(width: number, height: number): Promise<boolean> {
  const result = await safeInvoke("resize_window", { width, height });
  return result !== null;
}

/**
 * Toggle fullscreen mode.
 */
export async function toggleFullscreen(): Promise<boolean> {
  const result = await safeInvoke("toggle_fullscreen");
  return result !== null;
}

/**
 * Set always-on-top.
 */
export async function setAlwaysOnTop(value: boolean): Promise<boolean> {
  const result = await safeInvoke("set_always_on_top", { value });
  return result !== null;
}

/**
 * Minimize to system tray.
 */
export async function minimizeToTray(): Promise<boolean> {
  const result = await safeInvoke("minimize_to_tray");
  return result !== null;
}

// ── Deep link parsing ────────────────────────────────────────────────────

/**
 * Parse a deep link URL (crosstide://path?key=value).
 */
export function parseDeepLink(url: string): DeepLinkPayload | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "crosstide:") return null;
    const query: Record<string, string> = {};
    for (const [key, value] of parsed.searchParams) {
      query[key] = value;
    }
    return {
      url,
      path: (parsed.hostname + parsed.pathname).replace(/^\/+/, ""),
      query,
    };
  } catch {
    return null;
  }
}

// ── Tray menu ────────────────────────────────────────────────────────────

/**
 * Build tray menu action definitions.
 */
export function buildTrayActions(options?: { includeAlwaysOnTop?: boolean }): TrayAction[] {
  const actions: TrayAction[] = [
    { id: "show", label: "Show CrossTide" },
    { id: "dashboard", label: "Open Dashboard" },
    { id: "refresh", label: "Refresh Data", shortcut: "Ctrl+R" },
  ];

  if (options?.includeAlwaysOnTop) {
    actions.push({ id: "pin", label: "Always on Top", shortcut: "Ctrl+T" });
  }

  actions.push({ id: "quit", label: "Quit", shortcut: "Ctrl+Q" });
  return actions;
}

/**
 * Build default window options for the main CrossTide window.
 */
export function defaultWindowOptions(): WindowOptions {
  return {
    title: "CrossTide",
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    fullscreen: false,
    alwaysOnTop: false,
  };
}
