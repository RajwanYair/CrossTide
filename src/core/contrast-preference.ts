/**
 * Enhanced-contrast preference (WCAG 2.2 SC 1.4.6 AAA).
 *
 * Toggles `data-contrast="aaa"` on `<html>`, which activates the enhanced
 * palette in `src/styles/a11y.css`. Persisted in localStorage so the choice
 * survives reloads; applied once at boot before the first paint.
 */

const CONTRAST_STORAGE = "crosstide:contrast";
const AAA = "aaa";

/** Read the stored enhanced-contrast preference. */
export function isEnhancedContrast(): boolean {
  try {
    return localStorage.getItem(CONTRAST_STORAGE) === AAA;
  } catch {
    return false;
  }
}

/** Persist the preference and apply it to the document immediately. */
export function setEnhancedContrast(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(CONTRAST_STORAGE, AAA);
    else localStorage.removeItem(CONTRAST_STORAGE);
  } catch {
    // Storage may be unavailable (private mode); still apply for this session.
  }
  applyEnhancedContrast(enabled);
}

/** Reflect the given preference onto `<html>`. */
export function applyEnhancedContrast(enabled: boolean): void {
  const root = document.documentElement;
  if (enabled) root.setAttribute("data-contrast", AAA);
  else root.removeAttribute("data-contrast");
}

/** Apply the stored preference at boot. */
export function initEnhancedContrast(): void {
  applyEnhancedContrast(isEnhancedContrast());
}
