/**
 * Tests for alert server-side evaluation — R7.
 */
import { describe, it, expect } from "vitest";
import {
  evaluateCondition,
  evaluateAlerts,
  loadEnabledAlerts,
  handleScheduledAlertEval,
} from "../../../worker/routes/alert-eval";
import type { AlertCondition, QuoteSnapshot } from "../../../worker/routes/alert-eval";

const sampleQuote: QuoteSnapshot = {
  symbol: "AAPL",
  price: 150,
  changePercent: 2.5,
  volume: 50000000,
};

describe("evaluateCondition", () => {
  it("price above — true when price exceeds threshold", () => {
    const cond: AlertCondition = { field: "price", operator: "above", value: 140 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(true);
  });

  it("price above — false when price below threshold", () => {
    const cond: AlertCondition = { field: "price", operator: "above", value: 160 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(false);
  });

  it("price below — true when price under threshold", () => {
    const cond: AlertCondition = { field: "price", operator: "below", value: 160 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(true);
  });

  it("price below — false when price above threshold", () => {
    const cond: AlertCondition = { field: "price", operator: "below", value: 100 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(false);
  });

  it("changePercent above", () => {
    const cond: AlertCondition = { field: "changePercent", operator: "above", value: 2.0 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(true);
  });

  it("volume below", () => {
    const cond: AlertCondition = { field: "volume", operator: "below", value: 100000000 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(true);
  });

  it("crosses — true when value is near threshold", () => {
    const cond: AlertCondition = { field: "price", operator: "crosses", value: 150 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(true);
  });

  it("crosses — false when value is far from threshold", () => {
    const cond: AlertCondition = { field: "price", operator: "crosses", value: 200 };
    expect(evaluateCondition(cond, sampleQuote)).toBe(false);
  });
});

describe("loadEnabledAlerts", () => {
  it("parses condition JSON from D1 rows", async () => {
    const mockDb = {
      prepare: () => ({
        all: async () => ({
          results: [
            {
              id: "a1",
              user_id: "u1",
              ticker: "AAPL",
              condition: JSON.stringify({ field: "price", operator: "above", value: 140 }),
              enabled: 1,
              last_fired: null,
            },
          ],
          success: true,
          meta: {},
        }),
        bind: () => ({ run: async () => ({ results: [], success: true, meta: {} }) }),
      }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };

    const rules = await loadEnabledAlerts(mockDb);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.condition.field).toBe("price");
    expect(rules[0]!.condition.operator).toBe("above");
    expect(rules[0]!.condition.value).toBe(140);
  });
});

describe("evaluateAlerts", () => {
  it("fires matching alerts and calls markAlertFired", async () => {
    const runCalls: unknown[][] = [];
    const mockDb = {
      prepare: (sql: string) => ({
        all: async () => ({
          results: [
            {
              id: "a1",
              user_id: "u1",
              ticker: "AAPL",
              condition: JSON.stringify({ field: "price", operator: "above", value: 140 }),
              enabled: 1,
              last_fired: null,
            },
            {
              id: "a2",
              user_id: "u2",
              ticker: "MSFT",
              condition: JSON.stringify({ field: "price", operator: "below", value: 100 }),
              enabled: 1,
              last_fired: null,
            },
          ],
          success: true,
          meta: {},
        }),
        bind: (...args: unknown[]) => ({
          run: async () => {
            runCalls.push([sql, ...args]);
            return { results: [], success: true, meta: {} };
          },
        }),
      }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };

    const quotes = new Map<string, QuoteSnapshot>([
      ["AAPL", { symbol: "AAPL", price: 150, changePercent: 2, volume: 1000 }],
      ["MSFT", { symbol: "MSFT", price: 300, changePercent: 1, volume: 2000 }],
    ]);

    const fired = await evaluateAlerts(mockDb, quotes);
    // Only AAPL > 140 should fire; MSFT is 300 which is not < 100
    expect(fired).toHaveLength(1);
    expect(fired[0]!.ticker).toBe("AAPL");
    expect(fired[0]!.currentValue).toBe(150);
  });
});

describe("handleScheduledAlertEval", () => {
  it("returns empty when no DB", async () => {
    const result = await handleScheduledAlertEval({});
    expect(result).toHaveLength(0);
  });

  it("returns empty when no enabled alerts", async () => {
    const mockDb = {
      prepare: () => ({
        all: async () => ({ results: [], success: true, meta: {} }),
        bind: () => ({ run: async () => ({ results: [], success: true, meta: {} }) }),
      }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };
    const result = await handleScheduledAlertEval({ DB: mockDb });
    expect(result).toHaveLength(0);
  });

  it("evaluates alerts from KV-cached quotes", async () => {
    const mockDb = {
      prepare: (sql: string) => ({
        all: async () => ({
          results: sql.includes("SELECT")
            ? [
                {
                  id: "a1",
                  user_id: "u1",
                  ticker: "TSLA",
                  condition: JSON.stringify({ field: "price", operator: "above", value: 200 }),
                  enabled: 1,
                  last_fired: null,
                },
              ]
            : [],
          success: true,
          meta: {},
        }),
        bind: () => ({
          run: async () => ({ results: [], success: true, meta: {} }),
        }),
      }),
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    };

    const mockKv = {
      get: async (_key: string, _type: string) => ({
        symbol: "TSLA",
        price: 250,
        changePercent: 5,
        volume: 9000000,
      }),
    };

    const result = await handleScheduledAlertEval({ DB: mockDb, QUOTE_CACHE: mockKv as never });
    expect(result).toHaveLength(1);
    expect(result[0]!.ticker).toBe("TSLA");
    expect(result[0]!.currentValue).toBe(250);
  });
});
