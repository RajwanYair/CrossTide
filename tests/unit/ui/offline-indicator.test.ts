import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initOfflineIndicator } from "../../../src/ui/offline-indicator";

describe("offline-indicator", () => {
  let dispose: () => void;

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    dispose?.();
  });

  it("shows banner when offline event fires", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    dispose = initOfflineIndicator();
    expect(document.getElementById("offline-indicator")).toBeNull();

    window.dispatchEvent(new Event("offline"));
    const banner = document.getElementById("offline-indicator");
    expect(banner).not.toBeNull();
    expect(banner!.getAttribute("role")).toBe("alert");
    expect(banner!.textContent).toContain("offline");
  });

  it("hides banner when online event fires", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    dispose = initOfflineIndicator();
    expect(document.getElementById("offline-indicator")).not.toBeNull();

    window.dispatchEvent(new Event("online"));
    const banner = document.getElementById("offline-indicator");
    // Triggers exit animation — element still in DOM until animationend
    expect(banner!.classList.contains("offline-banner--exit")).toBe(true);
  });

  it("shows banner immediately if already offline on init", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    dispose = initOfflineIndicator();
    expect(document.getElementById("offline-indicator")).not.toBeNull();
  });

  it("does not show banner if online on init", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    dispose = initOfflineIndicator();
    expect(document.getElementById("offline-indicator")).toBeNull();
  });

  it("dispose removes listeners and banner", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    dispose = initOfflineIndicator();
    expect(document.getElementById("offline-indicator")).not.toBeNull();

    dispose();
    expect(document.getElementById("offline-indicator")).toBeNull();
  });
});
