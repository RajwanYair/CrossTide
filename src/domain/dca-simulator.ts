/**
 * Dollar-cost average (DCA) simulator — model recurring investments
 * and calculate average cost basis, total shares, and performance.
 */

export interface DcaInvestment {
  readonly date: string;
  readonly price: number;
  readonly amount: number; // dollar amount invested
}

export interface DcaResult {
  readonly totalInvested: number;
  readonly totalShares: number;
  readonly averageCost: number;
  readonly currentValue: number;
  readonly gainLoss: number;
  readonly gainLossPercent: number;
  readonly investmentCount: number;
}

/**
 * Simulate a DCA strategy from a list of investments and current price.
 */
export function simulateDca(
  investments: readonly DcaInvestment[],
  currentPrice: number,
): DcaResult {
  let totalInvested = 0;
  let totalShares = 0;

  for (const inv of investments) {
    if (inv.price > 0) {
      totalShares += inv.amount / inv.price;
      totalInvested += inv.amount;
    }
  }

  const averageCost = totalShares > 0 ? totalInvested / totalShares : 0;
  const currentValue = totalShares * currentPrice;
  const gainLoss = currentValue - totalInvested;
  const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalShares,
    averageCost,
    currentValue,
    gainLoss,
    gainLossPercent,
    investmentCount: investments.length,
  };
}

/**
 * Generate a DCA schedule from a price history with fixed amount.
 */
export function generateDcaSchedule(
  prices: readonly { date: string; price: number }[],
  amount: number,
  intervalDays = 30,
): DcaInvestment[] {
  if (prices.length === 0) return [];

  const investments: DcaInvestment[] = [];
  let lastDate = 0;

  for (const p of prices) {
    const ts = new Date(p.date).getTime();
    if (lastDate === 0 || ts - lastDate >= intervalDays * 86_400_000) {
      investments.push({ date: p.date, price: p.price, amount });
      lastDate = ts;
    }
  }

  return investments;
}

/**
 * Compare DCA vs lump-sum investment.
 */
export function dcaVsLumpSum(
  investments: readonly DcaInvestment[],
  currentPrice: number,
  firstPrice: number,
): { dcaReturn: number; lumpSumReturn: number; dcaWins: boolean } {
  const dca = simulateDca(investments, currentPrice);
  const totalInvested = dca.totalInvested;
  const lumpSumShares = firstPrice > 0 ? totalInvested / firstPrice : 0;
  const lumpSumValue = lumpSumShares * currentPrice;
  const lumpSumReturn =
    totalInvested > 0 ? ((lumpSumValue - totalInvested) / totalInvested) * 100 : 0;

  return {
    dcaReturn: dca.gainLossPercent,
    lumpSumReturn,
    dcaWins: dca.gainLossPercent > lumpSumReturn,
  };
}

/**
 * Calculate the cost basis at each investment point (running average).
 */
export function runningCostBasis(investments: readonly DcaInvestment[]): number[] {
  const basis: number[] = [];
  let totalInvested = 0;
  let totalShares = 0;

  for (const inv of investments) {
    if (inv.price > 0) {
      totalShares += inv.amount / inv.price;
      totalInvested += inv.amount;
    }
    basis.push(totalShares > 0 ? totalInvested / totalShares : 0);
  }

  return basis;
}
