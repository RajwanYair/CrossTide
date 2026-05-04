/**
 * Bar Replay tests — R1.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createBarReplay } from "../../../src/domain/bar-replay";
import type { Candle } from "../../../src/domain/bar-replay";

function makeCandles(n: number): Candle[] {
  return Array.from({ length: n }, (_, i) => ({
    time: 1_000_000 + i * 86400,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 102 + i,
    volume: 1_000_000,
  }));
}

describe("createBarReplay — initial state", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits the first candle immediately on creation", () => {
    const ticks: number[] = [];
    const candles = makeCandles(5);
    createBarReplay(candles, { onTick: (_c, idx) => ticks.push(idx) });
    expect(ticks).toEqual([0]);
  });

  it("reports correct initial state", () => {
    const candles = makeCandles(10);
    const replay = createBarReplay(candles, { onTick: () => undefined });
    const state = replay.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.currentIndex).toBe(0);
    expect(state.total).toBe(10);
    expect(state.speed).toBe(1);
    expect(state.progress).toBe(0);
  });

  it("respects startIndex option", () => {
    const ticks: number[] = [];
    const candles = makeCandles(10);
    createBarReplay(candles, { startIndex: 5, onTick: (_c, idx) => ticks.push(idx) });
    expect(ticks).toEqual([5]);
  });
});

describe("step()", () => {
  it("advances one candle at a time", () => {
    const ticks: number[] = [];
    const candles = makeCandles(5);
    const replay = createBarReplay(candles, { onTick: (_c, idx) => ticks.push(idx) });
    replay.step();
    replay.step();
    expect(ticks).toEqual([0, 1, 2]);
  });

  it("calls onComplete when stepping past the last candle", () => {
    let completed = false;
    const candles = makeCandles(2);
    const replay = createBarReplay(candles, {
      onTick: () => undefined,
      onComplete: () => {
        completed = true;
      },
    });
    replay.step(); // → index 1 (last)
    replay.step(); // → past end
    expect(completed).toBe(true);
  });
});

describe("play() and pause()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances candles over time at the default speed", () => {
    const ticks: number[] = [];
    const candles = makeCandles(5);
    const replay = createBarReplay(candles, {
      intervalMs: 1000,
      onTick: (_c, idx) => ticks.push(idx),
    });
    replay.play();
    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);
    expect(ticks).toContain(1);
    expect(ticks).toContain(2);
  });

  it("pauses playback", () => {
    const ticks: number[] = [];
    const candles = makeCandles(10);
    const replay = createBarReplay(candles, {
      intervalMs: 1000,
      onTick: (_c, idx) => ticks.push(idx),
    });
    replay.play();
    vi.advanceTimersByTime(1000);
    replay.pause();
    const countAfterPause = ticks.length;
    vi.advanceTimersByTime(3000);
    expect(ticks.length).toBe(countAfterPause);
    expect(replay.getState().isPlaying).toBe(false);
  });

  it("calls onComplete when the last candle is emitted", () => {
    let completed = false;
    const candles = makeCandles(3);
    createBarReplay(candles, {
      intervalMs: 100,
      onTick: () => undefined,
      onComplete: () => {
        completed = true;
      },
    }).play();
    vi.advanceTimersByTime(500);
    expect(completed).toBe(true);
  });

  it("does not restart if already at the end", () => {
    const ticks: number[] = [];
    const candles = makeCandles(2);
    const replay = createBarReplay(candles, {
      intervalMs: 100,
      onTick: (_c, idx) => ticks.push(idx),
    });
    replay.play();
    vi.advanceTimersByTime(300);
    const countAtEnd = ticks.length;
    replay.play(); // no-op — at end
    vi.advanceTimersByTime(300);
    expect(ticks.length).toBe(countAtEnd);
  });
});

describe("seek()", () => {
  it("jumps to a specific index and emits the candle", () => {
    const ticks: number[] = [];
    const candles = makeCandles(10);
    const replay = createBarReplay(candles, { onTick: (_c, idx) => ticks.push(idx) });
    replay.seek(7);
    expect(ticks).toContain(7);
    expect(replay.getState().currentIndex).toBe(7);
  });

  it("clamps index to [0, total - 1]", () => {
    const candles = makeCandles(5);
    const replay = createBarReplay(candles, { onTick: () => undefined });
    replay.seek(-10);
    expect(replay.getState().currentIndex).toBe(0);
    replay.seek(999);
    expect(replay.getState().currentIndex).toBe(4);
  });
});

describe("reset()", () => {
  it("resets to startIndex and pauses", () => {
    vi.useFakeTimers();
    const ticks: number[] = [];
    const candles = makeCandles(5);
    const replay = createBarReplay(candles, { onTick: (_c, idx) => ticks.push(idx) });
    replay.play();
    vi.advanceTimersByTime(1500);
    replay.reset();
    expect(replay.getState().currentIndex).toBe(0);
    expect(replay.getState().isPlaying).toBe(false);
    vi.useRealTimers();
  });
});

describe("setSpeed()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("10x speed runs 10x faster", () => {
    const ticks: number[] = [];
    const candles = makeCandles(20);
    const replay = createBarReplay(candles, {
      intervalMs: 1000,
      speed: 10,
      onTick: (_c, idx) => ticks.push(idx),
    });
    replay.play();
    vi.advanceTimersByTime(1000); // at 10x = 10 ticks of 100ms each
    expect(ticks.length).toBeGreaterThanOrEqual(10);
  });

  it("speed is clamped to [0.1, 100]", () => {
    const candles = makeCandles(5);
    const replay = createBarReplay(candles, { onTick: () => undefined });
    replay.setSpeed(-1);
    expect(replay.getState().speed).toBe(0.1);
    replay.setSpeed(9999);
    expect(replay.getState().speed).toBe(100);
  });
});

describe("dispose()", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("cancels the timer and stops ticks", () => {
    const ticks: number[] = [];
    const candles = makeCandles(10);
    const replay = createBarReplay(candles, {
      intervalMs: 100,
      onTick: (_c, idx) => ticks.push(idx),
    });
    replay.play();
    vi.advanceTimersByTime(200);
    replay.dispose();
    const countAfterDispose = ticks.length;
    vi.advanceTimersByTime(1000);
    expect(ticks.length).toBe(countAfterDispose);
  });

  it("is safe to call multiple times", () => {
    const replay = createBarReplay(makeCandles(5), { onTick: () => undefined });
    expect(() => {
      replay.dispose();
      replay.dispose();
    }).not.toThrow();
  });
});

describe("progress", () => {
  it("reports 0 at index 0, 1 at last index", () => {
    const candles = makeCandles(5);
    const replay = createBarReplay(candles, { onTick: () => undefined });
    expect(replay.getState().progress).toBeCloseTo(0);
    replay.seek(4);
    expect(replay.getState().progress).toBeCloseTo(1);
  });
});
