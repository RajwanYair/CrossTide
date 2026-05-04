/**
 * Session state persistence — saves and restores the user's navigation
 * state (active route, selected ticker, scroll position) across page reloads.
 *
 * Uses sessionStorage so state is retained within a tab session but not
 * across different tabs or after closing the browser.
 */

const STORAGE_KEY = "crosstide-session-state";

export interface SessionState {
  readonly route: string;
  readonly selectedTicker: string;
  readonly scrollY: number;
  readonly timestamp: number;
}

/**
 * Save current session state.
 */
export function saveSessionState(state: Omit<SessionState, "timestamp">): void {
  const full: SessionState = { ...state, timestamp: Date.now() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

/**
 * Restore saved session state. Returns null if no state is saved
 * or if the saved state is older than maxAgeMs (default 30 minutes).
 */
export function restoreSessionState(maxAgeMs: number = 30 * 60 * 1000): SessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SessionState;
    if (Date.now() - state.timestamp > maxAgeMs) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

/**
 * Clear saved session state.
 */
export function clearSessionState(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if there is a saved session state.
 */
export function hasSessionState(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) !== null;
}
