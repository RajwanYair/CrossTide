/**
 * Card ticker context tests — verifies each card reads ctx.params["symbol"]
 * and renders content for the provided ticker.
 */
import { describe, it, expect, beforeEach } from "vitest";

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
    card.mount(container, { route: "consensus", params: { symbol: "MSFT" } });
    expect(container.textContent).toContain("MSFT");
  });

  it("update re-renders with new ticker", async () => {
    const mod = await import("../../src/cards/consensus-card");
    const card = mod.default;
    const handle = card.mount(container, { route: "consensus", params: { symbol: "AAPL" } });
    expect(container.textContent).toContain("AAPL");
    handle?.update?.({ route: "consensus", params: { symbol: "MSFT" } });
    expect(container.textContent).toContain("MSFT");
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
    card.mount(container, { route: "backtest", params: { symbol: "MSFT" } });
    // The ticker input/select should show MSFT
    const _tickerInput = container.querySelector<HTMLInputElement>("#ticker-input, [id*=ticker]");
    // The ticker should appear somewhere in the rendered output
    expect(container.innerHTML).toContain("MSFT");
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
    card.mount(container, { route: "consensus-timeline", params: { symbol: "MSFT" } });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker");
    expect(select?.value).toBe("MSFT");
  });

  it("mount adds non-demo ticker to options", async () => {
    const mod = await import("../../src/cards/consensus-timeline-card");
    const card = mod.default;
    card.mount(container, { route: "consensus-timeline", params: { symbol: "MSFT" } });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker");
    const options = [...(select?.options ?? [])].map((o) => o.value);
    expect(options).toContain("MSFT");
  });

  it("update re-renders with new ticker", async () => {
    const mod = await import("../../src/cards/consensus-timeline-card");
    const card = mod.default;
    const handle = card.mount(container, {
      route: "consensus-timeline",
      params: { symbol: "AAPL" },
    });
    handle?.update?.({ route: "consensus-timeline", params: { symbol: "MSFT" } });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker");
    expect(select?.value).toBe("MSFT");
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
    card.mount(container, { route: "comparison", params: { symbol: "MSFT" } });
    const input = container.querySelector<HTMLInputElement>("#comparison-tickers");
    expect(input?.value).toContain("MSFT");
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
    card.mount(container, { route: "seasonality", params: { symbol: "MSFT" } });
    expect(container.textContent).toContain("MSFT");
  });

  it("update re-renders with new ticker", async () => {
    const mod = await import("../../src/cards/seasonality-card");
    const card = mod.default;
    const handle = card.mount(container, { route: "seasonality", params: { symbol: "AAPL" } });
    expect(container.textContent).toContain("AAPL");
    handle?.update?.({ route: "seasonality", params: { symbol: "MSFT" } });
    expect(container.textContent).toContain("MSFT");
  });
});
