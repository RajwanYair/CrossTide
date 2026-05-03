/**
 * Card ticker context tests — verifies each card reads ctx.params["symbol"]
 * and renders content for the provided ticker.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { CardContext } from "../../src/cards/registry";

function makeCtx(symbol: string): CardContext {
  return { route: "chart", params: { symbol } };
}

describe("consensus-card reads symbol param", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
  });

  it("mount renders with the provided ticker", async () => {
    const mod = await import("../../src/cards/consensus-card");
    const card = mod.default;
    card.mount(container, { route: "consensus", params: { symbol: "INTC" } });
    expect(container.textContent).toContain("INTC");
  });

  it("update re-renders with new ticker", async () => {
    const mod = await import("../../src/cards/consensus-card");
    const card = mod.default;
    const handle = card.mount(container, { route: "consensus", params: { symbol: "AAPL" } });
    expect(container.textContent).toContain("AAPL");
    handle?.update?.({ route: "consensus", params: { symbol: "INTC" } });
    expect(container.textContent).toContain("INTC");
  });

  it("mount with empty symbol shows empty state", async () => {
    const mod = await import("../../src/cards/consensus-card");
    const card = mod.default;
    card.mount(container, { route: "consensus", params: {} });
    // Should not crash; may show empty state or no ticker name
    expect(container.innerHTML).not.toBe("");
  });
});

describe("backtest-card reads symbol param", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
  });

  it("mount uses provided ticker in the UI", async () => {
    const mod = await import("../../src/cards/backtest-card");
    const card = mod.default;
    card.mount(container, { route: "backtest", params: { symbol: "INTC" } });
    // The ticker input/select should show INTC
    const tickerInput = container.querySelector<HTMLInputElement>("#ticker-input, [id*=ticker]");
    // The ticker should appear somewhere in the rendered output
    expect(container.innerHTML).toContain("INTC");
  });

  it("mount defaults to AAPL when no symbol", async () => {
    const mod = await import("../../src/cards/backtest-card");
    const card = mod.default;
    card.mount(container, { route: "backtest", params: {} });
    expect(container.innerHTML).toContain("AAPL");
  });
});

describe("consensus-timeline-card reads symbol param", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
  });

  it("mount pre-selects the provided ticker", async () => {
    const mod = await import("../../src/cards/consensus-timeline-card");
    const card = mod.default;
    card.mount(container, { route: "consensus-timeline", params: { symbol: "INTC" } });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker");
    expect(select?.value).toBe("INTC");
  });

  it("mount adds non-demo ticker to options", async () => {
    const mod = await import("../../src/cards/consensus-timeline-card");
    const card = mod.default;
    card.mount(container, { route: "consensus-timeline", params: { symbol: "INTC" } });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker");
    const options = [...(select?.options ?? [])].map((o) => o.value);
    expect(options).toContain("INTC");
  });

  it("update re-renders with new ticker", async () => {
    const mod = await import("../../src/cards/consensus-timeline-card");
    const card = mod.default;
    const handle = card.mount(container, {
      route: "consensus-timeline",
      params: { symbol: "AAPL" },
    });
    handle?.update?.({ route: "consensus-timeline", params: { symbol: "INTC" } });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker");
    expect(select?.value).toBe("INTC");
  });
});

describe("comparison-card reads symbol param", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
  });

  it("mount pre-fills input with provided ticker", async () => {
    const mod = await import("../../src/cards/comparison-card");
    const card = mod.default;
    card.mount(container, { route: "comparison", params: { symbol: "INTC" } });
    const input = container.querySelector<HTMLInputElement>("#comparison-tickers");
    expect(input?.value).toContain("INTC");
  });

  it("mount leaves input empty when no symbol", async () => {
    const mod = await import("../../src/cards/comparison-card");
    const card = mod.default;
    card.mount(container, { route: "comparison", params: {} });
    const input = container.querySelector<HTMLInputElement>("#comparison-tickers");
    expect(input?.value).toBe("");
  });
});

describe("seasonality-card reads symbol param", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
  });

  it("mount uses the provided ticker", async () => {
    const mod = await import("../../src/cards/seasonality-card");
    const card = mod.default;
    card.mount(container, { route: "seasonality", params: { symbol: "INTC" } });
    expect(container.textContent).toContain("INTC");
  });

  it("update re-renders with new ticker", async () => {
    const mod = await import("../../src/cards/seasonality-card");
    const card = mod.default;
    const handle = card.mount(container, { route: "seasonality", params: { symbol: "AAPL" } });
    expect(container.textContent).toContain("AAPL");
    handle?.update?.({ route: "seasonality", params: { symbol: "INTC" } });
    expect(container.textContent).toContain("INTC");
  });
});
