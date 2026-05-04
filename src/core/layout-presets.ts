/**
 * Dashboard layout presets — save and restore named card arrangements.
 * Each preset stores visible cards and their order.
 */

export interface LayoutPreset {
  readonly name: string;
  readonly cards: readonly string[];
  readonly createdAt: number;
}

const STORAGE_KEY = "crosstide-layout-presets";
const ACTIVE_KEY = "crosstide-active-layout";
const MAX_PRESETS = 20;

let cache: LayoutPreset[] | null = null;

function load(): LayoutPreset[] {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as LayoutPreset[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(presets: LayoutPreset[]): void {
  cache = presets;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/**
 * Save a new layout preset. Overwrites if name already exists.
 */
export function savePreset(name: string, cards: readonly string[]): void {
  const presets = load();
  const trimmed = name.trim();
  if (!trimmed) return;

  const idx = presets.findIndex((p) => p.name === trimmed);
  const preset: LayoutPreset = { name: trimmed, cards: [...cards], createdAt: Date.now() };

  if (idx >= 0) {
    presets[idx] = preset;
  } else {
    if (presets.length >= MAX_PRESETS) presets.shift();
    presets.push(preset);
  }
  save(presets);
}

/**
 * Get all saved presets.
 */
export function getPresets(): readonly LayoutPreset[] {
  return load();
}

/**
 * Get a specific preset by name.
 */
export function getPreset(name: string): LayoutPreset | null {
  return load().find((p) => p.name === name) ?? null;
}

/**
 * Delete a preset by name.
 */
export function deletePreset(name: string): boolean {
  const presets = load();
  const idx = presets.findIndex((p) => p.name === name);
  if (idx < 0) return false;
  presets.splice(idx, 1);
  save(presets);
  return true;
}

/**
 * Rename a preset.
 */
export function renamePreset(oldName: string, newName: string): boolean {
  const presets = load();
  const preset = presets.find((p) => p.name === oldName);
  if (!preset) return false;
  if (presets.some((p) => p.name === newName)) return false;
  const idx = presets.indexOf(preset);
  presets[idx] = { ...preset, name: newName.trim() };
  save(presets);
  return true;
}

/**
 * Set the active layout name (for restoring on reload).
 */
export function setActivePreset(name: string | null): void {
  if (name === null) {
    localStorage.removeItem(ACTIVE_KEY);
  } else {
    localStorage.setItem(ACTIVE_KEY, name);
  }
}

/**
 * Get the active layout name.
 */
export function getActivePreset(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

/**
 * Clear all presets.
 */
export function clearPresets(): void {
  cache = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_KEY);
}

/**
 * Get max presets limit.
 */
export function getMaxPresets(): number {
  return MAX_PRESETS;
}
