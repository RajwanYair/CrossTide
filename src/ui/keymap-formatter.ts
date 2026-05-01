/**
 * Keymap formatter — converts logical accelerator strings into platform-
 * appropriate display labels.
 *
 *   "Mod+K"          -> macOS: "⌘K"          | other: "Ctrl+K"
 *   "Mod+Shift+P"    -> macOS: "⇧⌘P"         | other: "Ctrl+Shift+P"
 *   "Alt+ArrowUp"    -> macOS: "⌥↑"          | other: "Alt+↑"
 * `Mod` resolves to ⌘ on macOS and Ctrl elsewhere. Order on macOS follows
 * Apple HIG: Ctrl, Opt, Shift, Cmd, key.
 */

export interface KeymapOptions {
  readonly platform?: "mac" | "other";
  readonly separator?: string;
}

const MAC_SYMBOLS: Readonly<Record<string, string>> = {
  mod: "⌘",
  cmd: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  opt: "⌥",
  shift: "⇧",
  enter: "↵",
  return: "↵",
  tab: "⇥",
  backspace: "⌫",
  delete: "⌦",
  escape: "⎋",
  esc: "⎋",
  space: "␣",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const OTHER_LABELS: Readonly<Record<string, string>> = {
  mod: "Ctrl",
  cmd: "Cmd",
  meta: "Meta",
  ctrl: "Ctrl",
  control: "Ctrl",
  alt: "Alt",
  option: "Alt",
  opt: "Alt",
  shift: "Shift",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  escape: "Esc",
  esc: "Esc",
  space: "Space",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};

const MAC_ORDER: Readonly<Record<string, number>> = {
  "⌃": 0,
  "⌥": 1,
  "⇧": 2,
  "⌘": 3,
};

export function formatKeymap(accel: string, options: KeymapOptions = {}): string {
  const platform = options.platform ?? detectPlatform();
  const isMac = platform === "mac";
  const sep = options.separator ?? (isMac ? "" : "+");
  const tokens = accel.split("+").map((t) => t.trim()).filter((t) => t.length > 0);
  if (tokens.length === 0) return "";

  const map = isMac ? MAC_SYMBOLS : OTHER_LABELS;
  const mapped = tokens.map((t) => {
    const lower = t.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(map, lower)) return map[lower]!;
    // Single letter: uppercase. Multi-char unknown token: keep as-is.
    return t.length === 1 ? t.toUpperCase() : t;
  });

  if (isMac) {
    // Stable sort by HIG order; non-modifiers (key) keep insertion order at end.
    const modifiers = mapped.filter((s) => s in MAC_ORDER);
    const others = mapped.filter((s) => !(s in MAC_ORDER));
    modifiers.sort((a, b) => MAC_ORDER[a]! - MAC_ORDER[b]!);
    return [...modifiers, ...others].join(sep);
  }
  return mapped.join(sep);
}

function detectPlatform(): "mac" | "other" {
  if (typeof navigator === "undefined") return "other";
  const platform = (navigator as { userAgentData?: { platform?: string } })
    .userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform) ? "mac" : "other";
}
