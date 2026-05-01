import { describe, it, expect } from "vitest";
import { CircuitBreaker, CircuitOpenError } from "../../../src/providers/circuit-breaker";

function makeClock(): { now: () => number; advance: (ms: number) => void } {
  let t = 0;
  return { now: () => t, advance: (ms) => (t += ms) };
}

describe("CircuitBreaker", () => {
  it("starts closed and allows requests", () => {
    const cb = new CircuitBreaker("p", {
      failureThreshold: 3,
      cooldownMs: 1000,
    });
    expect(cb.snapshot().state).toBe("closed");
    expect(cb.canRequest()).toBe(true);
  });

  it("trips open after failure threshold", () => {
    const cb = new CircuitBreaker("p", {
      failureThreshold: 2,
      cooldownMs: 1000,
    });
    cb.onFailure();
    cb.onFailure();
    expect(cb.snapshot().state).toBe("open");
    expect(cb.canRequest()).toBe(false);
  });

  it("resets failure counter on success", () => {
    const cb = new CircuitBreaker("p", {
      failureThreshold: 2,
      cooldownMs: 1000,
    });
    cb.onFailure();
    cb.onSuccess();
    cb.onFailure();
    expect(cb.snapshot().state).toBe("closed");
  });

  it("transitions to half-open after cooldown", () => {
    const clock = makeClock();
    const cb = new CircuitBreaker("p", {
      failureThreshold: 1,
      cooldownMs: 500,
      now: clock.now,
    });
    cb.onFailure();
    expect(cb.canRequest()).toBe(false);
    clock.advance(600);
    expect(cb.canRequest()).toBe(true);
    expect(cb.snapshot().state).toBe("half-open");
  });

  it("closes from half-open on probe success", () => {
    const clock = makeClock();
    const cb = new CircuitBreaker("p", {
      failureThreshold: 1,
      cooldownMs: 100,
      now: clock.now,
    });
    cb.onFailure();
    clock.advance(101);
    cb.canRequest();
    cb.onSuccess();
    expect(cb.snapshot().state).toBe("closed");
  });

  it("re-opens from half-open on probe failure", () => {
    const clock = makeClock();
    const cb = new CircuitBreaker("p", {
      failureThreshold: 1,
      cooldownMs: 100,
      now: clock.now,
    });
    cb.onFailure();
    clock.advance(101);
    cb.canRequest();
    cb.onFailure();
    expect(cb.snapshot().state).toBe("open");
  });

  it("run() throws CircuitOpenError when open", async () => {
    const cb = new CircuitBreaker("p", {
      failureThreshold: 1,
      cooldownMs: 1000,
    });
    cb.onFailure();
    await expect(cb.run(async () => 42)).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it("run() records success/failure", async () => {
    const cb = new CircuitBreaker("p", {
      failureThreshold: 2,
      cooldownMs: 1000,
    });
    await cb.run(async () => 1);
    await expect(
      cb.run(async () => {
        throw new Error("x");
      }),
    ).rejects.toThrow("x");
    expect(cb.snapshot().failures).toBe(1);
  });

  it("reset returns to closed", () => {
    const cb = new CircuitBreaker("p", {
      failureThreshold: 1,
      cooldownMs: 1000,
    });
    cb.onFailure();
    cb.reset();
    expect(cb.snapshot().state).toBe("closed");
    expect(cb.canRequest()).toBe(true);
  });

  it("validates options", () => {
    expect(() => new CircuitBreaker("p", { failureThreshold: 0, cooldownMs: 100 })).toThrow();
    expect(() => new CircuitBreaker("p", { failureThreshold: 1, cooldownMs: -1 })).toThrow();
  });
});
