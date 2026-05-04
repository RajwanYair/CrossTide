/**
 * Multi-ticker batch selection — manage a selection set of tickers
 * for batch operations (delete, tag, export, compare).
 *
 * The selection is ephemeral (in-memory only) and cleared on navigation.
 */

const selected: Set<string> = new Set();
let listeners: Array<(selection: ReadonlySet<string>) => void> = [];

function notify(): void {
  const snapshot = new Set(selected);
  for (const fn of listeners) {
    fn(snapshot);
  }
}

/**
 * Select a ticker (add to batch).
 */
export function selectTicker(ticker: string): void {
  selected.add(ticker.toUpperCase());
  notify();
}

/**
 * Deselect a ticker (remove from batch).
 */
export function deselectTicker(ticker: string): void {
  selected.delete(ticker.toUpperCase());
  notify();
}

/**
 * Toggle selection state of a ticker.
 */
export function toggleTickerSelection(ticker: string): boolean {
  const key = ticker.toUpperCase();
  if (selected.has(key)) {
    selected.delete(key);
    notify();
    return false;
  }
  selected.add(key);
  notify();
  return true;
}

/**
 * Check if a ticker is selected.
 */
export function isTickerSelected(ticker: string): boolean {
  return selected.has(ticker.toUpperCase());
}

/**
 * Get all currently selected tickers.
 */
export function getSelectedTickers(): readonly string[] {
  return [...selected];
}

/**
 * Get the count of selected tickers.
 */
export function getSelectionCount(): number {
  return selected.size;
}

/**
 * Select all tickers from a list.
 */
export function selectAll(tickers: readonly string[]): void {
  for (const t of tickers) {
    selected.add(t.toUpperCase());
  }
  notify();
}

/**
 * Clear the entire selection.
 */
export function clearSelection(): void {
  selected.clear();
  notify();
}

/**
 * Subscribe to selection changes.
 * Returns an unsubscribe function.
 */
export function onSelectionChange(fn: (selection: ReadonlySet<string>) => void): () => void {
  listeners.push(fn);
  return (): void => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
