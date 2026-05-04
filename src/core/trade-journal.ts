/**
 * Trade journal log — record and query trade entries for performance
 * tracking and post-analysis of trading decisions.
 */

export interface TradeEntry {
  readonly id: string;
  readonly ticker: string;
  readonly action: "buy" | "sell";
  readonly price: number;
  readonly quantity: number;
  readonly timestamp: number;
  readonly notes: string;
  readonly tags: readonly string[];
}

const STORAGE_KEY = "crosstide-trade-journal";
const MAX_ENTRIES = 500;

let cache: TradeEntry[] | null = null;

function load(): TradeEntry[] {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as TradeEntry[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(entries: TradeEntry[]): void {
  cache = entries;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Add a new trade entry to the journal.
 */
export function addTrade(trade: Omit<TradeEntry, "id" | "timestamp">): TradeEntry {
  const entries = load();
  const entry: TradeEntry = {
    ...trade,
    ticker: trade.ticker.toUpperCase(),
    id: generateId(),
    timestamp: Date.now(),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  save(entries);
  return entry;
}

/**
 * Get all journal entries (newest last).
 */
export function getJournal(): readonly TradeEntry[] {
  return load();
}

/**
 * Get recent N trades.
 */
export function getRecentTrades(count: number): readonly TradeEntry[] {
  return load().slice(-count);
}

/**
 * Get trades for a specific ticker.
 */
export function getTradesForTicker(ticker: string): readonly TradeEntry[] {
  return load().filter((e) => e.ticker === ticker.toUpperCase());
}

/**
 * Get trades filtered by action type.
 */
export function getTradesByAction(action: "buy" | "sell"): readonly TradeEntry[] {
  return load().filter((e) => e.action === action);
}

/**
 * Get trades filtered by tag.
 */
export function getTradesByTag(tag: string): readonly TradeEntry[] {
  const t = tag.toLowerCase();
  return load().filter((e) => e.tags.some((tg) => tg.toLowerCase() === t));
}

/**
 * Delete a trade by ID.
 */
export function deleteTrade(id: string): boolean {
  const entries = load();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx < 0) return false;
  entries.splice(idx, 1);
  save(entries);
  return true;
}

/**
 * Get total invested value (sum of buy quantity * price).
 */
export function getTotalInvested(): number {
  return load()
    .filter((e) => e.action === "buy")
    .reduce((sum, e) => sum + e.price * e.quantity, 0);
}

/**
 * Get total sold value.
 */
export function getTotalSold(): number {
  return load()
    .filter((e) => e.action === "sell")
    .reduce((sum, e) => sum + e.price * e.quantity, 0);
}

/**
 * Clear all journal entries.
 */
export function clearJournal(): void {
  cache = [];
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get max entries limit.
 */
export function getMaxEntries(): number {
  return MAX_ENTRIES;
}
