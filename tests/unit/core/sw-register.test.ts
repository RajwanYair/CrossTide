import { describe, it, expect, vi } from "vitest";
import { registerServiceWorker } from "../../../src/core/sw-register";

describe("registerServiceWorker", () => {
  it("returns null when serviceWorker not supported", async () => {
    const original = navigator.serviceWorker;
    Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true });
    const result = await registerServiceWorker();
    expect(result).toBeNull();
    Object.defineProperty(navigator, "serviceWorker", { value: original, configurable: true });
  });

  it("calls navigator.serviceWorker.register when available", async () => {
    const mockReg = { scope: "./" };
    const register = vi.fn().mockResolvedValue(mockReg);
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });

    const result = await registerServiceWorker("./sw.js");
    expect(register).toHaveBeenCalledWith("./sw.js", { scope: "./", type: "module" });
    expect(result).toBe(mockReg);
  });

  it("returns null on registration error", async () => {
    const register = vi.fn().mockRejectedValue(new Error("fail"));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });

    const result = await registerServiceWorker();
    expect(result).toBeNull();
  });
});
