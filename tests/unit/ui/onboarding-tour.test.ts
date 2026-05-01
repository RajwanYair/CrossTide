/**
 * Onboarding tour tests (C9).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createOnboardingTour,
  DEFAULT_TOUR_STEPS,
  type TourStep,
} from "../../../src/ui/onboarding-tour";

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

const MOCK_STEPS: readonly TourStep[] = [
  { target: "#step1", title: "Step 1", body: "First step body" },
  { target: "#step2", title: "Step 2", body: "Second step body" },
  { target: "#step3", title: "Step 3", body: "Third step body" },
];

function addTargets(): void {
  for (const id of ["step1", "step2", "step3"]) {
    const el = document.createElement("div");
    el.id = id;
    el.style.cssText = "width:100px;height:40px;";
    document.body.appendChild(el);
  }
}

function removeTargets(): void {
  for (const id of ["step1", "step2", "step3"]) {
    document.getElementById(id)?.remove();
  }
}

describe("createOnboardingTour", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
    addTargets();
  });

  afterEach(() => {
    document.getElementById("tour-overlay")?.remove();
    document.querySelector(".tour-tooltip")?.remove();
    removeTargets();
    vi.unstubAllGlobals();
  });

  it("isDone() is false initially", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    expect(tour.isDone()).toBe(false);
    tour.destroy();
  });

  it("start() renders the first tooltip step", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    const tooltip = document.querySelector(".tour-tooltip");
    expect(tooltip).toBeTruthy();
    expect(tooltip?.textContent).toContain("Step 1");
    tour.destroy();
  });

  it("start() is a no-op if already done", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.skip(); // marks done
    tour.start();
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    tour.destroy();
  });

  it("start() is a no-op if steps array is empty", () => {
    const tour = createOnboardingTour([]);
    tour.start();
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    tour.destroy();
  });

  it("skip() removes tooltip and marks done", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    expect(document.querySelector(".tour-tooltip")).toBeTruthy();
    tour.skip();
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    expect(tour.isDone()).toBe(true);
    tour.destroy();
  });

  it("Next button advances to step 2", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    const nextBtn = document.querySelector<HTMLButtonElement>(".tour-next");
    nextBtn?.click();
    const tooltip = document.querySelector(".tour-tooltip");
    expect(tooltip?.textContent).toContain("Step 2");
    tour.destroy();
  });

  it("Back button returns to previous step", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    document.querySelector<HTMLButtonElement>(".tour-next")?.click(); // advance to step 2
    document.querySelector<HTMLButtonElement>(".tour-prev")?.click(); // go back
    const tooltip = document.querySelector(".tour-tooltip");
    expect(tooltip?.textContent).toContain("Step 1");
    tour.destroy();
  });

  it("Skip button inside tooltip dismisses the tour", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    const skipBtn = document.querySelector<HTMLButtonElement>(".tour-skip");
    skipBtn?.click();
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    expect(tour.isDone()).toBe(true);
    tour.destroy();
  });

  it("'Get started' on last step completes the tour", () => {
    const singleStep: TourStep[] = [{ target: "#step1", title: "Only Step", body: "Done" }];
    const tour = createOnboardingTour(singleStep);
    tour.start();
    document.querySelector<HTMLButtonElement>(".tour-next")?.click();
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    expect(tour.isDone()).toBe(true);
    tour.destroy();
  });

  it("reset() clears done state", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.skip();
    expect(tour.isDone()).toBe(true);
    tour.reset();
    expect(tour.isDone()).toBe(false);
    tour.destroy();
  });

  it("destroy() removes tooltip and overlay from DOM", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    tour.destroy();
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    expect(document.getElementById("tour-overlay")).toBeNull();
  });

  it("DEFAULT_TOUR_STEPS has 3 steps", () => {
    expect(DEFAULT_TOUR_STEPS).toHaveLength(3);
    expect(DEFAULT_TOUR_STEPS[0]?.title).toBeTruthy();
    expect(DEFAULT_TOUR_STEPS[2]?.title).toBeTruthy();
  });

  it("step with missing target skips to next step", () => {
    const steps: TourStep[] = [
      { target: "#non-existent-el", title: "Missing", body: "Should skip" },
      { target: "#step1", title: "Visible", body: "Should show" },
    ];
    const tour = createOnboardingTour(steps);
    tour.start();
    const tooltip = document.querySelector(".tour-tooltip");
    expect(tooltip?.textContent).toContain("Visible");
    tour.destroy();
  });

  it("Escape key dismisses the tour", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    const tooltip = document.querySelector<HTMLElement>(".tour-tooltip");
    expect(tooltip).toBeTruthy();
    tooltip?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    expect(tour.isDone()).toBe(true);
    tour.destroy();
  });

  it("escapes HTML in step title and body to prevent XSS", () => {
    const xssSteps: TourStep[] = [
      {
        target: "#step1",
        title: "<script>alert(1)</script>",
        body: '<img src=x onerror="alert(2)">',
      },
    ];
    const tour = createOnboardingTour(xssSteps);
    tour.start();
    const tooltip = document.querySelector(".tour-tooltip");
    // Raw script/img tags must NOT appear as live DOM children
    expect(tooltip?.querySelector("script")).toBeNull();
    expect(tooltip?.querySelector("img")).toBeNull();
    // The escaped HTML entities should appear in innerHTML (not executed as tags)
    expect(tooltip?.innerHTML).toContain("&lt;script&gt;");
    tour.destroy();
  });

  it("overlay click also dismisses the tour", () => {
    const tour = createOnboardingTour(MOCK_STEPS);
    tour.start();
    const overlay = document.getElementById("tour-overlay") as HTMLElement;
    expect(overlay).toBeTruthy();
    overlay.click();
    expect(document.querySelector(".tour-tooltip")).toBeNull();
    expect(tour.isDone()).toBe(true);
    tour.destroy();
  });
});
