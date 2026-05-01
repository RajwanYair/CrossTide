import { describe, it, expect } from "vitest";
import { createCircuitBreaker } from "../../../src/core/circuit-breaker";

describe("circuit-breaker", () => {
  it("starts closed and allows calls", () => {
    const cb = createCircuitBreaker();
    expect(cb.snapshot().state).toBe("closed");
    expect(cb.allow()).toBe(true);
  });

  it("opens after failureThreshold consecutive failures", () => {
    const cb = createCircuitBreaker({ failureThreshold: 3 });
    cb.recordFailure(0);
    cb.recordFailure(0);
    expect(cb.snapshot().state).toBe("closed");
    cb.recordFailure(0);
    expect(cb.snapshot().state).toBe("open");
    expect(cb.allow(0)).toBe(false);
  });

  it("success resets failure count when closed", () => {
    const cb = createCircuitBreaker({ failureThreshold: 3 });
    cb.recordFailure(0);
    cb.recordFailure(0);
    cb.recordSuccess(0);
    expect(cb.snapshot().failures).toBe(0);
  });

  it("transitions to half-open after cooldown", () => {
    const cb = createCircuitBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    cb.recordFailure(0);
    expect(cb.allow(500)).toBe(false);
    expect(cb.allow(1500)).toBe(true);
    expect(cb.snapshot().state).toBe("half-open");
  });

  it("half-open success requirement closes breaker", () => {
    const cb = createCircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 100,
      halfOpenSuccesses: 2,
    });
    cb.recordFailure(0);
    cb.allow(200); // → half-open
    cb.recordSuccess(200);
    expect(cb.snapshot().state).toBe("half-open");
    cb.recordSuccess(200);
    expect(cb.snapshot().state).toBe("closed");
  });

  it("half-open failure re-opens breaker", () => {
    const cb = createCircuitBreaker({ failureThreshold: 1, cooldownMs: 100 });
    cb.recordFailure(0);
    cb.allow(200); // → half-open
    cb.recordFailure(200);
    expect(cb.snapshot().state).toBe("open");
  });

  it("reset returns to closed/zero", () => {
    const cb = createCircuitBreaker({ failureThreshold: 1 });
    cb.recordFailure(0);
    cb.reset();
    expect(cb.snapshot()).toEqual({
      state: "closed",
      failures: 0,
      successes: 0,
      openedAt: null,
    });
  });

  it("rehydrates from snapshot", () => {
    const cb = createCircuitBreaker(
      { cooldownMs: 1000 },
      { state: "open", failures: 5, successes: 0, openedAt: 0 },
    );
    expect(cb.allow(500)).toBe(false);
    expect(cb.allow(2000)).toBe(true);
  });
});
