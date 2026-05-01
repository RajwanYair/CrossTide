/**
 * Seasonality aggregations: average daily return grouped by month
 * (0–11) or day-of-week (0=Sun…6=Sat). Time inputs are ms since epoch.
 */

export interface SeasonalityBucket {
  readonly key: number;
  readonly label: string;
  readonly count: number;
  readonly meanReturn: number;
  readonly winRate: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const aggregate = (
  groups: Map<number, number[]>,
  labelOf: (k: number) => string,
): SeasonalityBucket[] => {
  const out: SeasonalityBucket[] = [];
  const keys = [...groups.keys()].sort((a, b) => a - b);
  for (const k of keys) {
    const rs = groups.get(k)!;
    if (rs.length === 0) continue;
    const sum = rs.reduce((s, r) => s + r, 0);
    const wins = rs.filter((r) => r > 0).length;
    out.push({
      key: k,
      label: labelOf(k),
      count: rs.length,
      meanReturn: sum / rs.length,
      winRate: wins / rs.length,
    });
  }
  return out;
};

export interface DailyReturn {
  readonly time: number;
  readonly returnFraction: number;
}

export function seasonalityByMonth(returns: readonly DailyReturn[]): SeasonalityBucket[] {
  const groups = new Map<number, number[]>();
  for (const r of returns) {
    const m = new Date(r.time).getUTCMonth();
    const arr = groups.get(m) ?? [];
    arr.push(r.returnFraction);
    groups.set(m, arr);
  }
  return aggregate(groups, (k) => MONTH_LABELS[k] ?? String(k));
}

export function seasonalityByDayOfWeek(returns: readonly DailyReturn[]): SeasonalityBucket[] {
  const groups = new Map<number, number[]>();
  for (const r of returns) {
    const d = new Date(r.time).getUTCDay();
    const arr = groups.get(d) ?? [];
    arr.push(r.returnFraction);
    groups.set(d, arr);
  }
  return aggregate(groups, (k) => DOW_LABELS[k] ?? String(k));
}
