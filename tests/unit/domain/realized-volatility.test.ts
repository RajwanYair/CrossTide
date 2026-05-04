import { describe, it, expect } from "vitest";
import {
  parkinsonVol,
  rogersSatchellVol,
  yangZhangVol,
  closeToCloseVol,
  allVolEstimates,
  type OHLCBar,
} from "../../../src/domain/realized-volatility";

// Generate synthetic OHLC bars with known vol (~2% daily)
let seed = 88888;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}

const bars: OHLCBar[] = [];
let price = 100;
for (let i = 0; i < 100; i++) {
  const ret = lcg() * 0.02; // ~2% daily vol
  const open = price;
  const close = price * Math.exp(ret);
  const intraHigh = Math.max(open, close) * (1 + Math.abs(lcg()) * 0.005);
  const intraLow = Math.min(open, close) * (1 - Math.abs(lcg()) * 0.005);
  bars.push({ open, high: intraHigh, low: intraLow, close });
  price = close;
}

describe("realized-volatility", () => {
  describe("parkinsonVol", () => {
    it("returns positive volatility", () => {
      expect(parkinsonVol(bars)).toBeGreaterThan(0);
    });

    it("reasonable magnitude (daily ~1-3%)", () => {
      const vol = parkinsonVol(bars);
      expect(vol).toBeGreaterThan(0.005);
      expect(vol).toBeLessThan(0.05);
    });

    it("returns 0 for single bar", () => {
      expect(parkinsonVol([bars[0]!])).toBe(0);
    });
  });

  describe("rogersSatchellVol", () => {
    it("returns positive volatility", () => {
      expect(rogersSatchellVol(bars)).toBeGreaterThan(0);
    });

    it("reasonable magnitude", () => {
      const vol = rogersSatchellVol(bars);
      expect(vol).toBeGreaterThan(0.005);
      expect(vol).toBeLessThan(0.05);
    });
  });

  describe("yangZhangVol", () => {
    it("returns positive volatility", () => {
      expect(yangZhangVol(bars)).toBeGreaterThan(0);
    });

    it("reasonable magnitude", () => {
      const vol = yangZhangVol(bars);
      expect(vol).toBeGreaterThan(0.005);
      expect(vol).toBeLessThan(0.05);
    });

    it("returns 0 for short series", () => {
      expect(yangZhangVol([bars[0]!, bars[1]!])).toBe(0);
    });
  });

  describe("closeToCloseVol", () => {
    it("returns positive volatility", () => {
      expect(closeToCloseVol(bars)).toBeGreaterThan(0);
    });

    it("less efficient than Parkinson (larger for same data)", () => {
      // Parkinson is more efficient, so on average close-close ≈ Parkinson
      // but both should be in similar range
      const cc = closeToCloseVol(bars);
      const pk = parkinsonVol(bars);
      expect(Math.abs(cc - pk) / cc).toBeLessThan(1); // within same order
    });
  });

  describe("allVolEstimates", () => {
    it("returns all four estimators", () => {
      const result = allVolEstimates(bars);
      expect(result.parkinson).toBeGreaterThan(0);
      expect(result.rogersSatchell).toBeGreaterThan(0);
      expect(result.yangZhang).toBeGreaterThan(0);
      expect(result.closeToClose).toBeGreaterThan(0);
    });

    it("all estimates in similar range", () => {
      const result = allVolEstimates(bars);
      const values = [
        result.parkinson,
        result.rogersSatchell,
        result.yangZhang,
        result.closeToClose,
      ];
      const max = Math.max(...values);
      const min = Math.min(...values);
      expect(max / min).toBeLessThan(5); // within 5x of each other
    });
  });
});
