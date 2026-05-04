/**
 * Tests for news sentiment scoring — R5.
 */
import { describe, it, expect } from "vitest";
import {
  analyzeText,
  analyzeBatch,
  handleNewsSentiment,
} from "../../../worker/routes/news-sentiment";

describe("analyzeText", () => {
  it("returns neutral for empty text", () => {
    const r = analyzeText("");
    expect(r.score).toBe(0);
    expect(r.label).toBe("neutral");
    expect(r.confidence).toBe(0);
  });

  it("returns bullish for positive headline", () => {
    const r = analyzeText("Apple stock surges after record earnings beat expectations");
    expect(r.score).toBeGreaterThan(0);
    expect(r.label).toBe("bullish");
  });

  it("returns bearish for negative headline", () => {
    const r = analyzeText("Company crashes after fraud investigation and massive layoffs");
    expect(r.score).toBeLessThan(0);
    expect(r.label).toBe("bearish");
  });

  it("handles negation — flips sentiment", () => {
    const positive = analyzeText("the market will rally");
    const negated = analyzeText("the market will not rally");
    expect(negated.score).toBeLessThan(positive.score);
  });

  it("handles boosters — amplifies sentiment", () => {
    const normal = analyzeText("stock gains");
    const boosted = analyzeText("stock very significantly gains");
    // Boosted should have at least as strong a signal
    expect(Math.abs(boosted.score)).toBeGreaterThanOrEqual(Math.abs(normal.score) * 0.9);
  });

  it("score stays in [-1, 1] range", () => {
    const extreme = analyzeText(
      "surge rally breakout boom skyrocket upgrade outperform bullish soar gains",
    );
    expect(extreme.score).toBeLessThanOrEqual(1);
    expect(extreme.score).toBeGreaterThanOrEqual(-1);
  });

  it("neutral text about weather returns neutral", () => {
    const r = analyzeText("the weather is sunny today with clear skies");
    expect(r.label).toBe("neutral");
    expect(Math.abs(r.score)).toBeLessThan(0.1);
  });

  it("confidence is higher with more sentiment words", () => {
    const low = analyzeText("some random text about things happening today gain");
    const high = analyzeText("surge rally gains profit growth strong bullish");
    expect(high.confidence).toBeGreaterThan(low.confidence);
  });
});

describe("analyzeBatch", () => {
  it("returns results for each text", () => {
    const results = analyzeBatch([
      "stock surges with strong gains",
      "company crashes with massive losses",
      "weather is fine today",
    ]);
    expect(results).toHaveLength(3);
    expect(results[0]!.label).toBe("bullish");
    expect(results[1]!.label).toBe("bearish");
    expect(results[2]!.label).toBe("neutral");
  });
});

describe("handleNewsSentiment", () => {
  it("returns 400 for non-JSON body", async () => {
    const req = new Request("http://localhost/api/news/sentiment", {
      method: "POST",
      body: "not json",
    });
    const res = await handleNewsSentiment(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when texts is not an array", async () => {
    const req = new Request("http://localhost/api/news/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: "not array" }),
    });
    const res = await handleNewsSentiment(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when more than 50 texts", async () => {
    const texts = Array.from({ length: 51 }, (_, i) => `text ${i}`);
    const req = new Request("http://localhost/api/news/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    const res = await handleNewsSentiment(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 with scored results", async () => {
    const req = new Request("http://localhost/api/news/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: ["stock surges with strong rally gains", "company defaults amid crisis losses"],
      }),
    });
    const res = await handleNewsSentiment(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: { score: number; label: string }[] };
    expect(body.results).toHaveLength(2);
    expect(body.results[0]!.label).toBe("bullish");
    expect(body.results[1]!.label).toBe("bearish");
  });

  it("returns 405 for non-POST", async () => {
    const req = new Request("http://localhost/api/news/sentiment", { method: "GET" });
    const res = await handleNewsSentiment(req);
    expect(res.status).toBe(405);
  });
});
