/**
 * Auto-theme sync — watches OS `prefers-color-scheme` and
 * `prefers-contrast` changes and applies them in real-time.
 *
 * Only auto-switches when the user hasn't explicitly overridden the theme
 * (i.e., no `crosstide-theme-override` key in localStorage).
 */
import { applyTheme, detectPreferredTheme, type Theme } from "./theme";

const OVERRIDE_KEY = "crosstide-theme-override";

/**
 * Check whether the user has explicitly chosen a theme.
 */
export function hasThemeOverride(): boolean {
  return localStorage.getItem(OVERRIDE_KEY) !== null;
}

/**
 * Set an explicit theme override. Pass `null` to clear and revert to auto.
 */
export function setThemeOverride(theme: Theme | null): void {
  if (theme === null) {
    localStorage.removeItem(OVERRIDE_KEY);
    applyTheme(detectPreferredTheme());
  } else {
    localStorage.setItem(OVERRIDE_KEY, theme);
    applyTheme(theme);
  }
}

/**
 * Get the current theme override, or null if following system.
 */
export function getThemeOverride(): Theme | null {
  const val = localStorage.getItem(OVERRIDE_KEY);
  if (val === "dark" || val === "light" || val === "high-contrast") return val;
  return null;
}

/**
 * Initialize auto-theme sync. Listens for system preference changes
 * and applies them unless user has an explicit override.
 * Returns a cleanup function.
 */
export function initAutoThemeSync(): () => void {
  const darkMq = window.matchMedia("(prefers-color-scheme: dark)");
  const contrastMq = window.matchMedia("(prefers-contrast: more)");

  function onSystemChange(): void {
    if (hasThemeOverride()) return;
    applyTheme(detectPreferredTheme());
  }

  darkMq.addEventListener("change", onSystemChange);
  contrastMq.addEventListener("change", onSystemChange);

  return (): void => {
    darkMq.removeEventListener("change", onSystemChange);
    contrastMq.removeEventListener("change", onSystemChange);
  };
}
