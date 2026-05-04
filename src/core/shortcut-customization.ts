/**
 * Keyboard shortcut customization — allows users to rebind shortcuts.
 *
 * Stores custom bindings in localStorage. Each binding maps an action name
 * to a key combo string (e.g., "Ctrl+R"). Falls back to defaults when no
 * custom binding exists.
 */

const STORAGE_KEY = "crosstide-custom-shortcuts";

export interface ShortcutBinding {
  readonly key: string;
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
}

export interface ShortcutDef {
  readonly action: string;
  readonly description: string;
  readonly defaultBinding: ShortcutBinding;
}

let cache: Map<string, ShortcutBinding> | null = null;

function load(): Map<string, ShortcutBinding> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, ShortcutBinding>;
      cache = new Map(Object.entries(parsed));
    } else {
      cache = new Map();
    }
  } catch {
    cache = new Map();
  }
  return cache;
}

function persist(): void {
  const map = load();
  const obj: Record<string, ShortcutBinding> = {};
  for (const [k, v] of map) {
    obj[k] = v;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

/**
 * Get the effective binding for an action.
 * Returns the custom binding if set, otherwise the default.
 */
export function getBinding(def: ShortcutDef): ShortcutBinding {
  const custom = load().get(def.action);
  return custom ?? def.defaultBinding;
}

/**
 * Set a custom binding for an action.
 */
export function setCustomBinding(action: string, binding: ShortcutBinding): void {
  load().set(action, binding);
  persist();
}

/**
 * Remove a custom binding, reverting to default.
 */
export function resetBinding(action: string): void {
  const map = load();
  map.delete(action);
  persist();
}

/**
 * Reset all custom bindings.
 */
export function resetAllBindings(): void {
  cache = new Map();
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get all custom bindings.
 */
export function getAllCustomBindings(): ReadonlyMap<string, ShortcutBinding> {
  return load();
}

/**
 * Format a binding as a human-readable combo string.
 */
export function formatBinding(binding: ShortcutBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join("+");
}

/**
 * Parse a combo string into a ShortcutBinding.
 * E.g., "Ctrl+Shift+R" → { key: "r", ctrl: true, shift: true }
 */
export function parseBinding(combo: string): ShortcutBinding {
  const parts = combo.split("+").map((p) => p.trim());
  const ctrl = parts.includes("Ctrl");
  const alt = parts.includes("Alt");
  const shift = parts.includes("Shift");
  const key = parts.filter((p) => !["Ctrl", "Alt", "Shift"].includes(p)).pop() ?? "";
  return {
    key: key.length === 1 ? key.toLowerCase() : key,
    ...(ctrl && { ctrl: true }),
    ...(alt && { alt: true }),
    ...(shift && { shift: true }),
  };
}
