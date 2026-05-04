/**
 * Dividend calendar planner — track ex-dividend dates, payment schedules,
 * and projected annual income from holdings.
 */

export interface DividendEntry {
  readonly ticker: string;
  readonly exDate: string; // ISO date
  readonly payDate: string; // ISO date
  readonly amount: number; // per share
  readonly frequency: "quarterly" | "monthly" | "semi-annual" | "annual";
}

export interface DividendProjection {
  readonly ticker: string;
  readonly annualPerShare: number;
  readonly shares: number;
  readonly annualIncome: number;
  readonly monthlyIncome: number;
  readonly nextExDate: string | null;
}

export interface MonthlyBreakdown {
  readonly month: number; // 1–12
  readonly total: number;
  readonly tickers: readonly string[];
}

/**
 * Calculate projected annual income from dividend entries and holdings.
 */
export function projectIncome(
  entries: readonly DividendEntry[],
  holdings: ReadonlyMap<string, number>, // ticker → shares
): DividendProjection[] {
  const byTicker = new Map<string, DividendEntry[]>();
  for (const e of entries) {
    const arr = byTicker.get(e.ticker) ?? [];
    arr.push(e);
    byTicker.set(e.ticker, arr);
  }

  const projections: DividendProjection[] = [];
  for (const [ticker, divs] of byTicker) {
    const shares = holdings.get(ticker) ?? 0;
    if (shares === 0) continue;

    const latest = divs[divs.length - 1]!;
    let annualPerShare: number;
    switch (latest.frequency) {
      case "quarterly":
        annualPerShare = latest.amount * 4;
        break;
      case "monthly":
        annualPerShare = latest.amount * 12;
        break;
      case "semi-annual":
        annualPerShare = latest.amount * 2;
        break;
      case "annual":
        annualPerShare = latest.amount;
        break;
    }

    const annualIncome = annualPerShare * shares;
    const now = new Date().toISOString().slice(0, 10);
    const futureDates = divs
      .filter((d) => d.exDate > now)
      .sort((a, b) => a.exDate.localeCompare(b.exDate));
    const nextExDate = futureDates.length > 0 ? futureDates[0]!.exDate : null;

    projections.push({
      ticker,
      annualPerShare,
      shares,
      annualIncome,
      monthlyIncome: annualIncome / 12,
      nextExDate,
    });
  }

  return projections;
}

/**
 * Get total projected annual dividend income.
 */
export function totalAnnualIncome(projections: readonly DividendProjection[]): number {
  return projections.reduce((s, p) => s + p.annualIncome, 0);
}

/**
 * Get monthly income breakdown from dividend entries.
 */
export function monthlyBreakdown(
  entries: readonly DividendEntry[],
  shares: ReadonlyMap<string, number>,
): MonthlyBreakdown[] {
  const months: MonthlyBreakdown[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthEntries = entries.filter((e) => {
      const payMonth = parseInt(e.payDate.slice(5, 7), 10);
      return payMonth === m;
    });
    const tickers = [...new Set(monthEntries.map((e) => e.ticker))];
    const total = monthEntries.reduce((s, e) => s + e.amount * (shares.get(e.ticker) ?? 0), 0);
    months.push({ month: m, total, tickers });
  }
  return months;
}

/**
 * Get upcoming ex-dividend dates within N days.
 */
export function upcomingExDates(
  entries: readonly DividendEntry[],
  withinDays = 30,
  today?: string,
): DividendEntry[] {
  const now = today ?? new Date().toISOString().slice(0, 10);
  const cutoff = new Date(new Date(now).getTime() + withinDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return entries
    .filter((e) => e.exDate >= now && e.exDate <= cutoff)
    .sort((a, b) => a.exDate.localeCompare(b.exDate));
}

/**
 * Calculate dividend yield given price and annual dividend.
 */
export function dividendYield(annualDividend: number, price: number): number {
  if (price <= 0) return 0;
  return (annualDividend / price) * 100;
}
