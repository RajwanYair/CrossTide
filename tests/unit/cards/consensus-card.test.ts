/**
 * Consensus card adapter tests.
 *
 * Validates mount/update delegate to renderConsensus and the CardModule contract.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { tickerDataStore, type TickerSnapshot } from "../../../src/core/app-store";
import type { CardHandle } from "../../../src/cards/registry";
import type { ConsensusResult } from "../../../src/types/domain";

vi.mock("../../../src/cards/consensus", () => ({
  renderConsensus: vi.fn(),
}));

describe("consensus-card (CardModule)", () => {
  let container: HTMLElement;
  let handle: CardHandle | void;

  const consensus: ConsensusResult = {
    ticker: "TSLA",
    direction: "BUY",
    buyMethods: [],
    sellMethods: [],
    strength: 0.75,
  };

  function snapshot(ticker: string, result: ConsensusResult | null): TickerSnapshot {
    return {
      ticker,
      price: 200,
      change: 2,
      changePercent: 1,
      volume: 1_000,
      avgVolume: 900,
      high52w: 250,
      low52w: 100,
      closes30d: [],
      consensus: result,
      candles: [],
    };
  }

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    tickerDataStore.set(new Map());
  });

  afterEach(() => {
    handle?.dispose?.();
    document.body.removeChild(container);
    tickerDataStore.set(new Map());
    vi.clearAllMocks();
  });

  it("mounts without throwing", async () => {
    const { default: consensusCard } = await import("../../../src/cards/consensus-card");
    expect(() => {
      handle = consensusCard.mount(container, {
        route: "consensus",
        params: { symbol: "AAPL" },
      });
    }).not.toThrow();
  });

  it("calls renderConsensus on mount with ticker", async () => {
    const { renderConsensus } = await import("../../../src/cards/consensus");
    const { default: consensusCard } = await import("../../../src/cards/consensus-card");
    handle = consensusCard.mount(container, { route: "consensus", params: { symbol: "TSLA" } });
    expect(renderConsensus).toHaveBeenCalledWith(container, "TSLA", null);
  });

  it("renders the selected ticker consensus from the shared store", async () => {
    tickerDataStore.set(new Map([["TSLA", snapshot("TSLA", consensus)]]));
    const { renderConsensus } = await import("../../../src/cards/consensus");
    const { default: consensusCard } = await import("../../../src/cards/consensus-card");

    handle = consensusCard.mount(container, { route: "consensus", params: { symbol: "TSLA" } });

    expect(renderConsensus).toHaveBeenCalledWith(container, "TSLA", consensus);
  });

  it("re-renders when data for the selected ticker arrives", async () => {
    const { renderConsensus } = await import("../../../src/cards/consensus");
    const { default: consensusCard } = await import("../../../src/cards/consensus-card");
    handle = consensusCard.mount(container, { route: "consensus", params: { symbol: "TSLA" } });
    vi.mocked(renderConsensus).mockClear();

    tickerDataStore.set(new Map([["TSLA", snapshot("TSLA", consensus)]]));

    expect(renderConsensus).toHaveBeenCalledWith(container, "TSLA", consensus);
  });

  it("uses empty string when symbol param is missing", async () => {
    const { renderConsensus } = await import("../../../src/cards/consensus");
    const { default: consensusCard } = await import("../../../src/cards/consensus-card");
    handle = consensusCard.mount(container, { route: "consensus", params: {} });
    expect(renderConsensus).toHaveBeenCalledWith(container, "", null);
  });

  it("update re-renders with new ticker", async () => {
    const { renderConsensus } = await import("../../../src/cards/consensus");
    const { default: consensusCard } = await import("../../../src/cards/consensus-card");
    handle = consensusCard.mount(container, {
      route: "consensus",
      params: { symbol: "AAPL" },
    });
    vi.mocked(renderConsensus).mockClear();
    handle?.update?.({ route: "consensus", params: { symbol: "GOOG" } });
    expect(renderConsensus).toHaveBeenCalledWith(container, "GOOG", null);
  });
});
