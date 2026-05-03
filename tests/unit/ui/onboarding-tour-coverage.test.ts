/**
 * Coverage for onboarding-tour.ts — positionTooltip placements, localStorage catch,
 * and target-not-in-DOM skip.
 * Targets lines 48, 83-96, 152.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createOnboardingTour } from "../../../src/ui/onboarding-tour";
import type { TourStep } from "../../../src/ui/onboarding-tour";

function storageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(i: number) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  };
}

describe("onboarding-tour coverage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skips to next step when target not in DOM (line 148-152)", () => {
    // Step 1 target doesn't exist; step 2 target does
    document.body.innerHTML = `<div id="real-target">Hello</div>`;

    const steps: TourStep[] = [
      { target: "#missing-element", title: "Step 1", body: "Missing", placement: "bottom" },
      { target: "#real-target", title: "Step 2", body: "Found", placement: "bottom" },
    ];
    const tour = createOnboardingTour(steps);
    tour.start();

    // Step 1 was skipped, step 2 should be rendered
    const tooltip = document.querySelector(".tour-tooltip");
    expect(tooltip).not.toBeNull();
    expect(tooltip!.textContent).toContain("Step 2");
    tour.skip();
  });

  it("completes tour when all targets are missing (line 150-151)", () => {
    const steps: TourStep[] = [
      { target: "#missing-1", title: "A", body: "A", placement: "bottom" },
      { target: "#missing-2", title: "B", body: "B", placement: "bottom" },
    ];
    const tour = createOnboardingTour(steps);
    tour.start();

    // All targets missing → complete is called → markDone
    expect(tour.isDone()).toBe(true);
  });

  it("positions tooltip on top placement (line 83-86)", () => {
    document.body.innerHTML = `<div id="target" style="width:100px;height:50px;">T</div>`;

    const steps: TourStep[] = [
      { target: "#target", title: "Top", body: "Above", placement: "top" },
    ];
    const tour = createOnboardingTour(steps);
    tour.start();

    const tooltip = document.querySelector(".tour-tooltip") as HTMLElement;
    expect(tooltip).not.toBeNull();
    expect(tooltip.style.transform).toContain("translateY(-100%)");
    tour.skip();
  });

  it("positions tooltip on left placement (line 88-91)", () => {
    document.body.innerHTML = `<div id="target" style="width:100px;height:50px;">T</div>`;

    const steps: TourStep[] = [
      { target: "#target", title: "Left", body: "Side", placement: "left" },
    ];
    const tour = createOnboardingTour(steps);
    tour.start();

    const tooltip = document.querySelector(".tour-tooltip") as HTMLElement;
    expect(tooltip).not.toBeNull();
    expect(tooltip.style.transform).toContain("translateX(-100%)");
    tour.skip();
  });

  it("positions tooltip on right placement (line 93-96)", () => {
    document.body.innerHTML = `<div id="target" style="width:100px;height:50px;">T</div>`;

    const steps: TourStep[] = [
      { target: "#target", title: "Right", body: "Side", placement: "right" },
    ];
    const tour = createOnboardingTour(steps);
    tour.start();

    const tooltip = document.querySelector(".tour-tooltip") as HTMLElement;
    expect(tooltip).not.toBeNull();
    expect(tooltip.style.transform).toContain("translateY(-50%)");
    // Right placement doesn't include translateX(-100%)
    expect(tooltip.style.transform).not.toContain("translateX(-100%)");
    tour.skip();
  });

  it("isDoneInStorage returns false when localStorage throws (line 48)", () => {
    const throwingStorage = {
      get length() {
        return 0;
      },
      key() {
        return null;
      },
      getItem(): string | null {
        throw new Error("SecurityError: localStorage blocked");
      },
      setItem() {
        throw new Error("SecurityError");
      },
      removeItem() {
        throw new Error("SecurityError");
      },
      clear() {
        throw new Error("SecurityError");
      },
    };
    vi.stubGlobal("localStorage", throwingStorage);

    const steps: TourStep[] = [{ target: "#target", title: "A", body: "B", placement: "bottom" }];
    const tour = createOnboardingTour(steps);
    // If localStorage throws, isDone returns false
    expect(tour.isDone()).toBe(false);
  });
});
