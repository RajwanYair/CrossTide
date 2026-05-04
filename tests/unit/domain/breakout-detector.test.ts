import { describe, it, expect } from "vitest";
import {
  rollingHigh,
  rollingLow,
  detectBreakouts,
  confirmedBreakouts,
  lastBreakout,
} from "../../../src/domain/breakout-detector";

describe("breakout-detector", () => {
  // Consolidation then breakout up
  const consolidation = Array.from({ length: 20 }, (_, i) => ({
    close: 100 + (i % 3) - 1, // oscillates 99-101
    volume: 1000,
  }));
  const breakoutUp = [
    ...consolidation,
    { close: 105, volume: 2000 }, // breakout with high volume
  ];

  // Consolidation then breakdown
  const breakdownDown = [
    ...consolidation,
    { close: 95, volume: 2000 }, // breakdown with high volume
  ];

  it("rollingHigh finds max in window", () => {
    const closes = [100, 102, 98, 105, 103];
    expect(rollingHigh(closes, 3, 4)).toBe(105); // looks at indices 1,2,3
  });

  it("rollingLow finds min in window", () => {
    const closes = [100, 102, 98, 105, 103];
    expect(rollingLow(closes, 3, 4)).toBe(98); // looks at indices 1,2,3
  });

  it("detects bullish breakout", () => {
    const events = detectBreakouts(breakoutUp, 20, 1.5);
    const bullish = events.filter((e) => e.type === "bullish");
    expect(bullish.length).toBeGreaterThan(0);
    expect(bullish[0]!.price).toBe(105);
  });

  it("detects bearish breakout", () => {
    const events = detectBreakouts(breakdownDown, 20, 1.5);
    const bearish = events.filter((e) => e.type === "bearish");
    expect(bearish.length).toBeGreaterThan(0);
    expect(bearish[0]!.price).toBe(95);
  });

  it("volume confirmation works", () => {
    const events = detectBreakouts(breakoutUp, 20, 1.5);
    const bullish = events.filter((e) => e.type === "bullish");
    expect(bullish[0]!.confirmed).toBe(true);
    expect(bullish[0]!.volumeRatio).toBe(2); // 2000/1000
  });

  it("low volume breakout not confirmed", () => {
    const lowVol = [...consolidation, { close: 105, volume: 500 }];
    const events = detectBreakouts(lowVol, 20, 1.5);
    const bullish = events.filter((e) => e.type === "bullish");
    expect(bullish[0]!.confirmed).toBe(false);
  });

  it("confirmedBreakouts filters unconfirmed", () => {
    const lowVol = [...consolidation, { close: 105, volume: 500 }];
    const confirmed = confirmedBreakouts(lowVol, 20, 1.5);
    expect(confirmed).toHaveLength(0);
  });

  it("confirmedBreakouts keeps confirmed", () => {
    const confirmed = confirmedBreakouts(breakoutUp, 20, 1.5);
    expect(confirmed.length).toBeGreaterThan(0);
  });

  it("lastBreakout returns most recent", () => {
    const last = lastBreakout(breakoutUp, 20, 1.5);
    expect(last).not.toBeNull();
    expect(last!.type).toBe("bullish");
  });

  it("lastBreakout returns null for no breakouts", () => {
    const flat = Array.from({ length: 25 }, () => ({ close: 100, volume: 1000 }));
    expect(lastBreakout(flat, 20, 1.5)).toBeNull();
  });

  it("no breakouts during consolidation", () => {
    const events = detectBreakouts(consolidation, 20, 1.5);
    // During pure consolidation no new highs/lows should be broken
    // (all within the range established in the lookback)
    expect(events.length).toBe(0);
  });
});
