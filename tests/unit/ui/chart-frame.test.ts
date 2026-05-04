/**
 * Unit tests for `<ct-chart-frame>` Web Component (Q6).
 */
import { describe, it, expect, beforeEach } from "vitest";
import "../../../src/ui/chart-frame";
import type { CtChartFrame } from "../../../src/ui/chart-frame";

function createElement(): CtChartFrame {
  return document.createElement("ct-chart-frame") as CtChartFrame;
}

describe("ct-chart-frame", () => {
  let el: CtChartFrame;

  beforeEach(() => {
    el = createElement();
  });

  it("is defined as a custom element", () => {
    expect(customElements.get("ct-chart-frame")).toBeDefined();
  });

  it("renders structure on connect", () => {
    document.body.appendChild(el);

    expect(el.querySelector(".ct-cf-header")).not.toBeNull();
    expect(el.querySelector(".ct-cf-body")).not.toBeNull();
    expect(el.querySelector(".ct-cf-overlay")).not.toBeNull();
    expect(el.querySelector(".ct-cf-chart")).not.toBeNull();

    document.body.removeChild(el);
  });

  it("shows idle state by default", () => {
    document.body.appendChild(el);

    const overlay = el.querySelector(".ct-cf-overlay") as HTMLElement;
    expect(overlay.hidden).toBe(false);
    expect(overlay.querySelector(".ct-cf-idle")).not.toBeNull();

    const chart = el.querySelector(".ct-cf-chart") as HTMLElement;
    expect(chart.style.visibility).toBe("hidden");

    document.body.removeChild(el);
  });

  it("shows loading state with spinner", () => {
    el.state = "loading";
    document.body.appendChild(el);

    const overlay = el.querySelector(".ct-cf-overlay") as HTMLElement;
    expect(overlay.querySelector(".ct-cf-spinner")).not.toBeNull();
    expect(overlay.querySelector('[role="status"]')).not.toBeNull();

    document.body.removeChild(el);
  });

  it("shows ready state — overlay hidden, chart visible", () => {
    document.body.appendChild(el);
    el.state = "ready";

    const overlay = el.querySelector(".ct-cf-overlay") as HTMLElement;
    expect(overlay.hidden).toBe(true);

    const chart = el.querySelector(".ct-cf-chart") as HTMLElement;
    expect(chart.style.visibility).toBe("visible");

    document.body.removeChild(el);
  });

  it("shows error state with message", () => {
    document.body.appendChild(el);
    el.state = "error";
    el.errorMessage = "Failed to load chart data";

    const overlay = el.querySelector(".ct-cf-overlay") as HTMLElement;
    expect(overlay.querySelector(".ct-cf-error")).not.toBeNull();
    expect(overlay.textContent).toContain("Failed to load chart data");

    document.body.removeChild(el);
  });

  it("displays ticker in header", () => {
    el.ticker = "AAPL";
    document.body.appendChild(el);

    const ticker = el.querySelector(".ct-cf-ticker");
    expect(ticker!.textContent).toBe("AAPL");

    document.body.removeChild(el);
  });

  it("updates ticker header dynamically", () => {
    document.body.appendChild(el);
    el.ticker = "MSFT";

    expect(el.querySelector(".ct-cf-ticker")!.textContent).toBe("MSFT");

    document.body.removeChild(el);
  });

  it("applies height to chart body", () => {
    el.height = 500;
    document.body.appendChild(el);

    const body = el.querySelector(".ct-cf-body") as HTMLElement;
    expect(body.style.height).toBe("500px");

    document.body.removeChild(el);
  });

  it("exposes chartContainer for mounting chart content", () => {
    document.body.appendChild(el);

    expect(el.chartContainer).not.toBeNull();
    expect(el.chartContainer!.classList.contains("ct-cf-chart")).toBe(true);

    document.body.removeChild(el);
  });

  it("responds to attribute changes", () => {
    document.body.appendChild(el);

    el.setAttribute("state", "loading");
    expect(el.querySelector(".ct-cf-spinner")).not.toBeNull();

    el.setAttribute("state", "ready");
    const overlay = el.querySelector(".ct-cf-overlay") as HTMLElement;
    expect(overlay.hidden).toBe(true);

    document.body.removeChild(el);
  });

  it("escapes error message HTML", () => {
    document.body.appendChild(el);
    el.state = "error";
    el.errorMessage = "<img onerror=alert(1)>";

    const overlay = el.querySelector(".ct-cf-overlay")!;
    expect(overlay.innerHTML).not.toContain("<img onerror");

    document.body.removeChild(el);
  });

  it("uses default error text when no errorMessage", () => {
    document.body.appendChild(el);
    el.state = "error";

    const error = el.querySelector(".ct-cf-error");
    expect(error!.textContent).toContain("Chart unavailable");

    document.body.removeChild(el);
  });
});
