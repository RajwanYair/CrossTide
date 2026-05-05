import { describe, it, expect } from "vitest";
import { handlePortfolioRebalance } from "../../../worker/routes/portfolio-rebalance";

type Env = Parameters<typeof handlePortfolioRebalance>[1];

function makeEnv(): Env {
  return {} as Env;
}

function makeRequest(body: unknown): Request {
  return new Request("https://test.local/api/portfolio/rebalance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handlePortfolioRebalance", () => {
  it("returns 400 for invalid JSON", async () => {
    const req = new Request("https://test.local/api/portfolio/rebalance", {
      method: "POST",
      body: "not json",
    });
    const res = await handlePortfolioRebalance(req, makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 400 when holdings missing", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({ targets: [{ ticker: "AAPL", weight: 1 }] }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("holdings");
  });

  it("returns 400 when targets missing", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({ holdings: [{ ticker: "AAPL", value: 1000 }] }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("targets");
  });

  it("returns 400 when targets do not sum to 1", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({
        holdings: [{ ticker: "AAPL", value: 1000 }],
        targets: [{ ticker: "AAPL", weight: 0.5 }],
      }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("sum to 1");
  });

  it("computes rebalance plan for balanced portfolio", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({
        holdings: [
          { ticker: "AAPL", value: 5000 },
          { ticker: "GOOG", value: 5000 },
        ],
        targets: [
          { ticker: "AAPL", weight: 0.5 },
          { ticker: "GOOG", weight: 0.5 },
        ],
      }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      needsRebalance: boolean;
      totalValue: number;
      actionableCount: number;
    };
    expect(body.needsRebalance).toBe(false);
    expect(body.totalValue).toBe(10000);
    expect(body.actionableCount).toBe(0);
  });

  it("computes trades for unbalanced portfolio", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({
        holdings: [
          { ticker: "AAPL", value: 8000 },
          { ticker: "GOOG", value: 2000 },
        ],
        targets: [
          { ticker: "AAPL", weight: 0.5 },
          { ticker: "GOOG", weight: 0.5 },
        ],
      }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      needsRebalance: boolean;
      trades: Array<{ ticker: string; action: string; tradeAmount: number }>;
      totalBuyAmount: number;
      totalSellAmount: number;
    };
    expect(body.needsRebalance).toBe(true);
    const aaplTrade = body.trades.find((t) => t.ticker === "AAPL")!;
    const googTrade = body.trades.find((t) => t.ticker === "GOOG")!;
    expect(aaplTrade.action).toBe("sell");
    expect(googTrade.action).toBe("buy");
    expect(body.totalBuyAmount).toBe(3000);
    expect(body.totalSellAmount).toBe(3000);
  });

  it("returns empty plan for zero total value", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({
        holdings: [{ ticker: "AAPL", value: 0 }],
        targets: [{ ticker: "AAPL", weight: 1 }],
      }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { totalValue: number; trades: unknown[] };
    expect(body.totalValue).toBe(0);
    expect(body.trades).toEqual([]);
  });

  it("normalizes tickers to uppercase", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({
        holdings: [{ ticker: "aapl", value: 10000 }],
        targets: [{ ticker: "aapl", weight: 1 }],
      }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { trades: Array<{ ticker: string }> };
    expect(body.trades[0]!.ticker).toBe("AAPL");
  });

  it("uses custom driftThreshold", async () => {
    const res = await handlePortfolioRebalance(
      makeRequest({
        holdings: [
          { ticker: "AAPL", value: 5200 },
          { ticker: "GOOG", value: 4800 },
        ],
        targets: [
          { ticker: "AAPL", weight: 0.5 },
          { ticker: "GOOG", weight: 0.5 },
        ],
        driftThreshold: 0.03,
      }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { needsRebalance: boolean; actionableCount: number };
    expect(body.needsRebalance).toBe(false);
    expect(body.actionableCount).toBe(0);
  });
});
