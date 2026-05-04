/**
 * Order flow imbalance — buy/sell pressure from tick-level trade classification.
 * Implements Lee-Ready tick rule, bulk volume classification, and VPIN.
 */

export interface Trade {
  readonly price: number;
  readonly volume: number;
  readonly timestamp?: number;
}

export interface OrderFlowMetrics {
  readonly buyVolume: number;
  readonly sellVolume: number;
  readonly imbalance: number; // (buy - sell) / (buy + sell), range [-1, 1]
  readonly vpin: number; // volume-synchronized probability of informed trading
  readonly toxicity: "low" | "moderate" | "high";
}

export interface FlowBucket {
  readonly buyVolume: number;
  readonly sellVolume: number;
  readonly imbalance: number;
  readonly cumulativeImbalance: number;
}

/**
 * Lee-Ready tick rule: classify trades as buyer/seller-initiated.
 * If price > previous price → buy; if price < previous → sell.
 * If price = previous, use previous classification.
 *
 * @param trades - Sequence of trades with prices and volumes
 * @returns Array of signed volumes (+buy, -sell)
 */
export function tickRuleClassify(trades: readonly Trade[]): number[] {
  const n = trades.length;
  if (n === 0) return [];

  const signed: number[] = new Array(n);
  signed[0] = trades[0]!.volume; // first trade assumed buy

  for (let i = 1; i < n; i++) {
    const priceDiff = trades[i]!.price - trades[i - 1]!.price;
    if (priceDiff > 0) {
      signed[i] = trades[i]!.volume; // uptick → buy
    } else if (priceDiff < 0) {
      signed[i] = -trades[i]!.volume; // downtick → sell
    } else {
      // zero tick → use previous direction
      signed[i] = Math.sign(signed[i - 1]!) * trades[i]!.volume;
    }
  }

  return signed;
}

/**
 * Bulk Volume Classification (BVC) — probabilistic trade classification.
 * Uses normalized price change to estimate buy probability.
 *
 * @param trades - Trade sequence
 * @param sigma - Price volatility for normalization
 */
export function bulkVolumeClassify(trades: readonly Trade[], sigma?: number): number[] {
  const n = trades.length;
  if (n < 2) return trades.map((t) => t.volume);

  // Estimate sigma from data if not provided
  const vol = sigma ?? estimateSigma(trades);
  if (vol <= 0) return trades.map((t) => t.volume);

  const signed: number[] = [];
  for (let i = 1; i < n; i++) {
    const dP = trades[i]!.price - trades[i - 1]!.price;
    const z = dP / vol;
    // Buy probability = Φ(z)
    const buyProb = normalCdf(z);
    const buyVol = trades[i]!.volume * buyProb;
    const sellVol = trades[i]!.volume * (1 - buyProb);
    signed.push(buyVol - sellVol);
  }

  return signed;
}

/**
 * Compute order flow imbalance metrics from classified trades.
 *
 * @param trades - Raw trades
 * @param bucketSize - Volume per VPIN bucket
 */
export function orderFlowImbalance(
  trades: readonly Trade[],
  bucketSize?: number,
): OrderFlowMetrics {
  const n = trades.length;
  if (n === 0) return { buyVolume: 0, sellVolume: 0, imbalance: 0, vpin: 0, toxicity: "low" };

  const signed = tickRuleClassify(trades);

  let buyVolume = 0,
    sellVolume = 0;
  for (const sv of signed) {
    if (sv > 0) buyVolume += sv;
    else sellVolume += Math.abs(sv);
  }

  const totalVolume = buyVolume + sellVolume;
  const imbalance = totalVolume > 0 ? (buyVolume - sellVolume) / totalVolume : 0;

  // Compute VPIN
  const vpin = computeVPIN(signed, bucketSize ?? Math.ceil(totalVolume / 50));

  let toxicity: OrderFlowMetrics["toxicity"];
  if (vpin > 0.7) toxicity = "high";
  else if (vpin > 0.4) toxicity = "moderate";
  else toxicity = "low";

  return { buyVolume, sellVolume, imbalance, vpin, toxicity };
}

/**
 * Volume-Synchronized Probability of Informed Trading (VPIN).
 * Groups trades into volume buckets and measures imbalance across buckets.
 *
 * @param signedVolumes - Pre-classified signed volumes
 * @param bucketSize - Volume per bucket
 * @param numBuckets - Number of trailing buckets for VPIN calculation
 */
export function computeVPIN(
  signedVolumes: readonly number[],
  bucketSize: number,
  numBuckets = 20,
): number {
  if (signedVolumes.length === 0 || bucketSize <= 0) return 0;

  // Fill volume buckets
  const buckets: FlowBucket[] = [];
  let currentBuy = 0,
    currentSell = 0,
    currentVol = 0,
    cumImbalance = 0;

  for (const sv of signedVolumes) {
    if (sv > 0) currentBuy += sv;
    else currentSell += Math.abs(sv);
    currentVol += Math.abs(sv);

    if (currentVol >= bucketSize) {
      const imbalance =
        currentBuy + currentSell > 0
          ? Math.abs(currentBuy - currentSell) / (currentBuy + currentSell)
          : 0;
      cumImbalance += imbalance;
      buckets.push({
        buyVolume: currentBuy,
        sellVolume: currentSell,
        imbalance,
        cumulativeImbalance: cumImbalance,
      });
      currentBuy = 0;
      currentSell = 0;
      currentVol = 0;
    }
  }

  if (buckets.length === 0) return 0;

  // VPIN = average absolute imbalance over last N buckets
  const trailingBuckets = buckets.slice(-numBuckets);
  const vpinSum = trailingBuckets.reduce((s, b) => s + b.imbalance, 0);
  return vpinSum / trailingBuckets.length;
}

/**
 * Compute flow buckets for visualization/analysis.
 */
export function flowBuckets(trades: readonly Trade[], bucketSize: number): FlowBucket[] {
  const signed = tickRuleClassify(trades);
  const buckets: FlowBucket[] = [];
  let currentBuy = 0,
    currentSell = 0,
    currentVol = 0,
    cumImbalance = 0;

  for (const sv of signed) {
    if (sv > 0) currentBuy += sv;
    else currentSell += Math.abs(sv);
    currentVol += Math.abs(sv);

    if (currentVol >= bucketSize) {
      const total = currentBuy + currentSell;
      const imbalance = total > 0 ? (currentBuy - currentSell) / total : 0;
      cumImbalance += imbalance;
      buckets.push({
        buyVolume: currentBuy,
        sellVolume: currentSell,
        imbalance,
        cumulativeImbalance: cumImbalance,
      });
      currentBuy = 0;
      currentSell = 0;
      currentVol = 0;
    }
  }

  return buckets;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return sign * y;
}

function estimateSigma(trades: readonly Trade[]): number {
  if (trades.length < 3) return 1;
  let sum = 0;
  for (let i = 1; i < trades.length; i++) {
    sum += (trades[i]!.price - trades[i - 1]!.price) ** 2;
  }
  return Math.sqrt(sum / (trades.length - 1));
}
