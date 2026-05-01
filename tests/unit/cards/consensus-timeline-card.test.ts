/**
 * Consensus timeline card adapter tests (B6 — consensus timeline activation).
 *
 * Verifies the CardModule renders ticker/day selects, single-ticker
 * timeline, and all-demo-tickers multi-view — all from deterministic
 * synthetic data (no network required).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("consensus-timeline-card (CardModule)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("mounts without throwing", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    expect(() =>
      ctCard.mount(container, { route: "consensus-timeline", params: {} }),
    ).not.toThrow();
  });

  it("renders ticker select with DEMO_TICKERS", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    ctCard.mount(container, { route: "consensus-timeline", params: {} });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker");
    expect(select).not.toBeNull();
    const options = Array.from(select?.options ?? []).map((o) => o.value);
    expect(options).toContain("AAPL");
    expect(options).toContain("MSFT");
    expect(options).toContain("NVDA");
    expect(options).toContain("JPM");
    expect(options).toContain("XOM");
  });

  it("renders days select with default 60", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    ctCard.mount(container, { route: "consensus-timeline", params: {} });
    const select = container.querySelector<HTMLSelectElement>("#tl-days");
    expect(select).not.toBeNull();
    expect(select?.value).toBe("60");
  });

  it("renders timeline-single-view section", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    ctCard.mount(container, { route: "consensus-timeline", params: {} });
    const single = container.querySelector("#timeline-single-view");
    expect(single).not.toBeNull();
    // Should have rendered content
    expect(single?.innerHTML.length).toBeGreaterThan(0);
  });

  it("renders timeline-multi-view with all demo tickers", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    ctCard.mount(container, { route: "consensus-timeline", params: {} });
    const multi = container.querySelector("#timeline-multi-view");
    expect(multi).not.toBeNull();
    const items = multi?.querySelectorAll(".timeline-multi-item");
    expect(items?.length).toBe(5);
  });

  it("shows 'All Demo Tickers' heading", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    ctCard.mount(container, { route: "consensus-timeline", params: {} });
    expect(container.textContent).toContain("All Demo Tickers");
  });

  it("changing ticker select re-renders single view", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    ctCard.mount(container, { route: "consensus-timeline", params: {} });
    const select = container.querySelector<HTMLSelectElement>("#tl-ticker")!;
    const before = container.querySelector("#timeline-single-view")?.innerHTML;
    // Switch to MSFT
    select.value = "MSFT";
    select.dispatchEvent(new Event("change"));
    const after = container.querySelector("#timeline-single-view")?.innerHTML;
    // Content should change when switching tickers
    expect(after?.length).toBeGreaterThan(0);
    // MSFT seed differs from AAPL seed → different HTML
    expect(after).not.toBe(before);
  });

  it("returns a CardHandle object", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    const handle = ctCard.mount(container, { route: "consensus-timeline", params: {} });
    expect(typeof handle === "object").toBe(true);
  });

  it("timeline layout class is present", async () => {
    const { default: ctCard } = await import("../../../src/cards/consensus-timeline-card");
    ctCard.mount(container, { route: "consensus-timeline", params: {} });
    expect(container.querySelector(".timeline-card-layout")).not.toBeNull();
  });
});
