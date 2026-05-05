/**
 * Insider Transactions Analysis — pure functions to analyze
 * insider buying/selling activity and compute sentiment metrics.
 *
 * All inputs are pre-fetched SEC Form 4 data — no I/O, no Date.now().
 *
 * @module domain/insider-transactions
 */

export interface InsiderTransaction {
  readonly name: string;
  readonly title: string; // CEO, CFO, Director, etc.
  readonly date: string; // ISO date
  readonly type: "buy" | "sell" | "exercise";
  readonly shares: number;
  readonly pricePerShare: number;
  readonly totalValue: number;
}

export interface InsiderSentiment {
  readonly totalBuys: number;
  readonly totalSells: number;
  readonly totalExercises: number;
  readonly buyValue: number;
  readonly sellValue: number;
  /** Buy/sell ratio by transaction count. >1 = net buying. */
  readonly buySellRatio: number;
  /** Buy/sell ratio by dollar value. >1 = net buying. */
  readonly buySellValueRatio: number;
  /** Net insider sentiment: -100 (all selling) to +100 (all buying). */
  readonly sentimentScore: number;
  /** Unique insider names who bought. */
  readonly uniqueBuyers: number;
  /** Unique insider names who sold. */
  readonly uniqueSellers: number;
  /** Largest single transaction. */
  readonly largestTransaction: InsiderTransaction;
  /** Most recent transaction. */
  readonly mostRecent: InsiderTransaction;
}

/**
 * Analyze insider transaction data and compute sentiment.
 *
 * @param transactions - Array of insider transactions (at least 1).
 * @returns Insider sentiment analysis or null if empty.
 */
export function analyzeInsiderTransactions(
  transactions: readonly InsiderTransaction[],
): InsiderSentiment | null {
  if (transactions.length === 0) return null;

  let totalBuys = 0;
  let totalSells = 0;
  let totalExercises = 0;
  let buyValue = 0;
  let sellValue = 0;
  const buyers = new Set<string>();
  const sellers = new Set<string>();

  let largest: InsiderTransaction = transactions[0]!;
  let mostRecent: InsiderTransaction = transactions[0]!;

  for (const t of transactions) {
    if (t.totalValue > largest.totalValue) largest = t;
    if (t.date > mostRecent.date) mostRecent = t;

    switch (t.type) {
      case "buy":
        totalBuys++;
        buyValue += t.totalValue;
        buyers.add(t.name);
        break;
      case "sell":
        totalSells++;
        sellValue += t.totalValue;
        sellers.add(t.name);
        break;
      case "exercise":
        totalExercises++;
        break;
    }
  }

  const buySellRatio =
    totalSells > 0 ? round6(totalBuys / totalSells) : totalBuys > 0 ? Infinity : 0;
  const buySellValueRatio =
    sellValue > 0 ? round6(buyValue / sellValue) : buyValue > 0 ? Infinity : 0;

  // Sentiment: map buy/sell counts to -100..+100
  const totalActivity = totalBuys + totalSells;
  const sentimentScore =
    totalActivity > 0 ? Math.round(((totalBuys - totalSells) / totalActivity) * 100) : 0;

  return {
    totalBuys,
    totalSells,
    totalExercises,
    buyValue: round6(buyValue),
    sellValue: round6(sellValue),
    buySellRatio,
    buySellValueRatio,
    sentimentScore,
    uniqueBuyers: buyers.size,
    uniqueSellers: sellers.size,
    largestTransaction: largest,
    mostRecent,
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
