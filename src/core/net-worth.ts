/**
 * Net worth tracker — record and track total portfolio value over time
 * for wealth growth visualization and goal tracking.
 */

export interface NetWorthEntry {
  readonly date: string; // ISO date
  readonly value: number;
  readonly note?: string;
}

export interface NetWorthGoal {
  readonly targetValue: number;
  readonly targetDate: string;
}

export interface NetWorthSummary {
  readonly currentValue: number;
  readonly previousValue: number;
  readonly changeAmount: number;
  readonly changePercent: number;
  readonly allTimeHigh: number;
  readonly allTimeLow: number;
  readonly entryCount: number;
}

const STORAGE_KEY = "crosstide-net-worth";

let cache: NetWorthEntry[] | null = null;

function load(): NetWorthEntry[] {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as NetWorthEntry[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(entries: NetWorthEntry[]): void {
  cache = entries;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Record a net worth snapshot.
 */
export function recordNetWorth(value: number, date?: string, note?: string): void {
  const entries = load();
  entries.push({
    date: date ?? new Date().toISOString().slice(0, 10),
    value,
    ...(note && { note }),
  });
  entries.sort((a, b) => a.date.localeCompare(b.date));
  save(entries);
}

/**
 * Get all net worth entries.
 */
export function getHistory(): readonly NetWorthEntry[] {
  return load();
}

/**
 * Get net worth summary.
 */
export function getSummary(): NetWorthSummary {
  const entries = load();
  if (entries.length === 0) {
    return {
      currentValue: 0,
      previousValue: 0,
      changeAmount: 0,
      changePercent: 0,
      allTimeHigh: 0,
      allTimeLow: 0,
      entryCount: 0,
    };
  }

  const currentValue = entries[entries.length - 1]!.value;
  const previousValue = entries.length > 1 ? entries[entries.length - 2]!.value : currentValue;
  const changeAmount = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (changeAmount / previousValue) * 100 : 0;
  const values = entries.map((e) => e.value);

  return {
    currentValue,
    previousValue,
    changeAmount,
    changePercent,
    allTimeHigh: Math.max(...values),
    allTimeLow: Math.min(...values),
    entryCount: entries.length,
  };
}

/**
 * Calculate progress toward a goal.
 */
export function goalProgress(goal: NetWorthGoal): {
  percent: number;
  remaining: number;
  onTrack: boolean;
} {
  const entries = load();
  const current = entries.length > 0 ? entries[entries.length - 1]!.value : 0;
  const percent = goal.targetValue > 0 ? (current / goal.targetValue) * 100 : 0;
  const remaining = goal.targetValue - current;

  // Simple: on track if current percent >= time elapsed percent
  const now = Date.now();
  const start = entries.length > 0 ? new Date(entries[0]!.date).getTime() : now;
  const end = new Date(goal.targetDate).getTime();
  const totalTime = end - start;
  const elapsed = now - start;
  const timePercent = totalTime > 0 ? (elapsed / totalTime) * 100 : 100;
  const onTrack = percent >= timePercent;

  return { percent: Math.min(percent, 100), remaining: Math.max(remaining, 0), onTrack };
}

/**
 * Get growth rate over the entire history (CAGR).
 */
export function cagr(): number {
  const entries = load();
  if (entries.length < 2) return 0;

  const first = entries[0]!;
  const last = entries[entries.length - 1]!;
  if (first.value <= 0) return 0;

  const years =
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 86_400_000);
  if (years <= 0) return 0;

  return (Math.pow(last.value / first.value, 1 / years) - 1) * 100;
}

/**
 * Delete an entry by date.
 */
export function deleteEntry(date: string): boolean {
  const entries = load();
  const idx = entries.findIndex((e) => e.date === date);
  if (idx < 0) return false;
  entries.splice(idx, 1);
  save(entries);
  return true;
}

/**
 * Clear all entries.
 */
export function clearHistory(): void {
  cache = [];
  localStorage.removeItem(STORAGE_KEY);
}
