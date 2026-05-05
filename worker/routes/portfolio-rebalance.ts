/**
 * POST /api/portfolio/rebalance — Portfolio rebalancing endpoint.
 *
 * Accepts current holdings (ticker + value) and target allocations (ticker + weight),
 * computes rebalance trades needed. Optionally accepts driftThreshold.
 */
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.^=-]{1,20}$/;

interface HoldingInput {
  readonly ticker: string;
  readonly value: number;
}

interface TargetInput {
  readonly ticker: string;
  readonly weight: number;
}

interface RebalanceTrade {
  readonly ticker: string;
  readonly currentWeight: number;
  readonly targetWeight: number;
  readonly drift: number;
  readonly tradeAmount: number;
  readonly action: "buy" | "sell" | "hold";
}

interface RebalanceResponse {
  readonly trades: readonly RebalanceTrade[];
  readonly totalValue: number;
  readonly maxDrift: number;
  readonly needsRebalance: boolean;
  readonly actionableCount: number;
  readonly totalBuyAmount: number;
  readonly totalSellAmount: number;
}

function isValidHolding(h: unknown): h is HoldingInput {
  if (typeof h !== "object" || h === null) return false;
  const obj = h as Record<string, unknown>;
  return typeof obj["ticker"] === "string" && typeof obj["value"] === "number" && obj["value"] >= 0;
}

function isValidTarget(t: unknown): t is TargetInput {
  if (typeof t !== "object" || t === null) return false;
  const obj = t as Record<string, unknown>;
  return (
    typeof obj["ticker"] === "string" &&
    typeof obj["weight"] === "number" &&
    obj["weight"] >= 0 &&
    obj["weight"] <= 1
  );
}

export async function handlePortfolioRebalance(request: Request, _env: Env): Promise<Response> {
  let body: { holdings?: unknown; targets?: unknown; driftThreshold?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.holdings) || body.holdings.length === 0) {
    return Response.json({ error: "holdings array required" }, { status: 400 });
  }

  if (!Array.isArray(body.targets) || body.targets.length === 0) {
    return Response.json({ error: "targets array required" }, { status: 400 });
  }

  const holdings: HoldingInput[] = [];
  for (const h of body.holdings as unknown[]) {
    if (!isValidHolding(h)) {
      return Response.json(
        { error: "Each holding needs ticker (string) and value (number >= 0)" },
        { status: 400 },
      );
    }
    if (!TICKER_RE.test(h.ticker.toUpperCase())) {
      return Response.json({ error: `Invalid ticker: ${h.ticker}` }, { status: 400 });
    }
    holdings.push({ ticker: h.ticker.toUpperCase(), value: h.value });
  }

  const targets: TargetInput[] = [];
  for (const t of body.targets as unknown[]) {
    if (!isValidTarget(t)) {
      return Response.json(
        { error: "Each target needs ticker (string) and weight (number 0-1)" },
        { status: 400 },
      );
    }
    if (!TICKER_RE.test(t.ticker.toUpperCase())) {
      return Response.json({ error: `Invalid ticker: ${t.ticker}` }, { status: 400 });
    }
    targets.push({ ticker: t.ticker.toUpperCase(), weight: t.weight });
  }

  const weightSum = targets.reduce((s, t) => s + t.weight, 0);
  if (Math.abs(weightSum - 1) > 0.01) {
    return Response.json(
      { error: `Target weights must sum to 1.0, got ${weightSum.toFixed(4)}` },
      { status: 400 },
    );
  }

  const driftThreshold =
    typeof body.driftThreshold === "number" && body.driftThreshold > 0 ? body.driftThreshold : 0.02;

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  if (totalValue === 0) {
    return Response.json({
      trades: [],
      totalValue: 0,
      maxDrift: 0,
      needsRebalance: false,
      actionableCount: 0,
      totalBuyAmount: 0,
      totalSellAmount: 0,
    } satisfies RebalanceResponse);
  }

  const holdingMap = new Map<string, number>();
  for (const h of holdings) {
    holdingMap.set(h.ticker, (holdingMap.get(h.ticker) ?? 0) + h.value);
  }

  const trades: RebalanceTrade[] = [];
  let maxDrift = 0;

  for (const target of targets) {
    const currentValue = holdingMap.get(target.ticker) ?? 0;
    const currentWeight = currentValue / totalValue;
    const drift = target.weight - currentWeight;
    const tradeAmount = drift * totalValue;
    const absDrift = Math.abs(drift);

    if (absDrift > maxDrift) maxDrift = absDrift;

    let action: "buy" | "sell" | "hold";
    if (drift > driftThreshold) action = "buy";
    else if (drift < -driftThreshold) action = "sell";
    else action = "hold";

    trades.push({
      ticker: target.ticker,
      currentWeight: Number(currentWeight.toFixed(6)),
      targetWeight: target.weight,
      drift: Number(drift.toFixed(6)),
      tradeAmount: Number(tradeAmount.toFixed(2)),
      action,
    });
  }

  const needsRebalance = maxDrift > driftThreshold;
  const actionableCount = trades.filter((t) => t.action !== "hold").length;
  const totalBuyAmount = trades
    .filter((t) => t.action === "buy")
    .reduce((s, t) => s + t.tradeAmount, 0);
  const totalSellAmount = trades
    .filter((t) => t.action === "sell")
    .reduce((s, t) => s + Math.abs(t.tradeAmount), 0);

  const result: RebalanceResponse = {
    trades,
    totalValue,
    maxDrift: Number(maxDrift.toFixed(6)),
    needsRebalance,
    actionableCount,
    totalBuyAmount: Number(totalBuyAmount.toFixed(2)),
    totalSellAmount: Number(totalSellAmount.toFixed(2)),
  };

  return Response.json(result);
}
