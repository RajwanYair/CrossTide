/**
 * Command palette — fuzzy-searchable list of named actions.
 *
 * Pure logic + minimal DOM hooks. Designed to be opened via `⌘K` / `Ctrl+K`.
 * Filtering is a simple subsequence match with a small ranking heuristic
 * (prefix > word-start > scattered).
 */

export interface PaletteCommand {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly section?: string;
  readonly run: () => void | Promise<void>;
}

export interface PaletteRanked extends PaletteCommand {
  readonly score: number;
}

/**
 * Score a command against a query. Returns -Infinity for no match.
 *
 * Scoring rules (higher is better):
 *   +100 exact label match (case-insensitive)
 *   +50  label starts with query
 *   +25  any word in label starts with query
 *   +10  subsequence match
 *   -i   minus the index of the first match (closer to start = better)
 */
export function scoreCommand(cmd: PaletteCommand, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const label = cmd.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 50 - label.length;
  for (const word of label.split(/\s+/)) {
    if (word.startsWith(q)) return 25 - label.indexOf(word);
  }
  // subsequence
  let i = 0;
  let firstMatch = -1;
  for (let j = 0; j < label.length && i < q.length; j++) {
    if (label[j] === q[i]) {
      if (firstMatch === -1) firstMatch = j;
      i++;
    }
  }
  if (i === q.length) return 10 - firstMatch;
  return -Infinity;
}

export function rankCommands(
  commands: readonly PaletteCommand[],
  query: string,
): readonly PaletteRanked[] {
  const ranked: PaletteRanked[] = [];
  for (const c of commands) {
    const score = scoreCommand(c, query);
    if (score > -Infinity) ranked.push({ ...c, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return ranked;
}

export interface PaletteState {
  readonly query: string;
  readonly selectedIndex: number;
  readonly results: readonly PaletteRanked[];
}

export function createPaletteState(commands: readonly PaletteCommand[]): {
  state(): PaletteState;
  setQuery(q: string): void;
  moveSelection(delta: number): void;
  selectIndex(i: number): void;
  selectedCommand(): PaletteRanked | null;
} {
  let query = "";
  let selectedIndex = 0;
  let results: readonly PaletteRanked[] = rankCommands(commands, "");

  function setQuery(q: string): void {
    query = q;
    results = rankCommands(commands, q);
    selectedIndex = 0;
  }

  function moveSelection(delta: number): void {
    if (results.length === 0) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = (((selectedIndex + delta) % results.length) + results.length) % results.length;
  }

  function selectIndex(i: number): void {
    if (i < 0 || i >= results.length) return;
    selectedIndex = i;
  }

  function selectedCommand(): PaletteRanked | null {
    return results[selectedIndex] ?? null;
  }

  function state(): PaletteState {
    return { query, selectedIndex, results };
  }

  return { state, setQuery, moveSelection, selectIndex, selectedCommand };
}
