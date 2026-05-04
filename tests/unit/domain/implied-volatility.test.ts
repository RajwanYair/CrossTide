import { describe, it, expect } from "vitest";
import {
  impliedVolatility,
  buildVolSurface,
  blackScholes,
  type OptionQuote,
} from "../../../src/domain/implied-volatility";

describe("implied-volatility", () => {
  describe("blackScholes", () => {
    it("ATM call price reasonable", () => {
      const price = blackScholes(100, 100, 1, 0.05, 0.2, "call");
      expect(price).toBeGreaterThan(5);
      expect(price).toBeLessThan(15);
    });

    it("put price > 0 for OTM put", () => {
      const price = blackScholes(100, 90, 0.5, 0.05, 0.25, "put");
      expect(price).toBeGreaterThan(0);
    });

    it("put-call parity holds", () => {
      const S = 100,
        K = 105,
        T = 1,
        r = 0.05,
        sigma = 0.3;
      const call = blackScholes(S, K, T, r, sigma, "call");
      const put = blackScholes(S, K, T, r, sigma, "put");
      // C - P = S - K*exp(-rT)
      const parity = call - put - (S - K * Math.exp(-r * T));
      expect(Math.abs(parity)).toBeLessThan(1e-8);
    });
  });

  describe("impliedVolatility", () => {
    it("recovers known vol from BS price", () => {
      const trueVol = 0.25;
      const price = blackScholes(100, 100, 1, 0.05, trueVol, "call");
      const quote: OptionQuote = {
        strike: 100,
        expiry: 1,
        price,
        type: "call",
        spot: 100,
        rate: 0.05,
      };
      const iv = impliedVolatility(quote);
      expect(iv).toBeCloseTo(trueVol, 4);
    });

    it("works for OTM put", () => {
      const trueVol = 0.3;
      const price = blackScholes(100, 90, 0.5, 0.03, trueVol, "put");
      const quote: OptionQuote = {
        strike: 90,
        expiry: 0.5,
        price,
        type: "put",
        spot: 100,
        rate: 0.03,
      };
      const iv = impliedVolatility(quote);
      expect(iv).toBeCloseTo(trueVol, 3);
    });

    it("works for deep ITM call", () => {
      const trueVol = 0.4;
      const price = blackScholes(100, 80, 0.25, 0.02, trueVol, "call");
      const quote: OptionQuote = {
        strike: 80,
        expiry: 0.25,
        price,
        type: "call",
        spot: 100,
        rate: 0.02,
      };
      const iv = impliedVolatility(quote);
      expect(iv).toBeCloseTo(trueVol, 2);
    });

    it("returns 0 for invalid inputs", () => {
      const quote: OptionQuote = {
        strike: 100,
        expiry: 0,
        price: 5,
        type: "call",
        spot: 100,
        rate: 0.05,
      };
      expect(impliedVolatility(quote)).toBe(0);
    });
  });

  describe("buildVolSurface", () => {
    // Generate a synthetic smile
    const spot = 100;
    const expiry = 0.25;
    const rate = 0.05;
    const baseVol = 0.2;

    const strikes = [85, 90, 95, 100, 105, 110, 115];
    const quotes: OptionQuote[] = strikes.map((K) => {
      // Add smile: higher vol for OTM options
      const moneyness = K / spot;
      const smile = 0.1 * (moneyness - 1) ** 2; // quadratic smile
      const vol = baseVol + smile;
      const type = K <= spot ? ("put" as const) : ("call" as const);
      const price = blackScholes(spot, K, expiry, rate, vol, type);
      return { strike: K, expiry, price, type, spot, rate };
    });

    it("extracts IV for most quotes", () => {
      const surface = buildVolSurface(quotes);
      expect(surface.points.length).toBeGreaterThanOrEqual(5);
    });

    it("ATM vol close to base vol", () => {
      const surface = buildVolSurface(quotes);
      expect(surface.atmVol).toBeCloseTo(baseVol, 2);
    });

    it("kurtosis is finite", () => {
      const surface = buildVolSurface(quotes);
      expect(Number.isFinite(surface.kurtosis)).toBe(true);
    });

    it("handles empty quotes", () => {
      const surface = buildVolSurface([]);
      expect(surface.points).toHaveLength(0);
      expect(surface.atmVol).toBe(0);
    });

    it("term structure computed for multi-expiry", () => {
      const multiExpiry: OptionQuote[] = [
        ...quotes,
        ...strikes.map((K) => {
          const vol = baseVol + 0.02; // slightly higher vol for longer expiry
          const type = K <= spot ? ("put" as const) : ("call" as const);
          const price = blackScholes(spot, K, 0.5, rate, vol, type);
          return { strike: K, expiry: 0.5, price, type, spot, rate };
        }),
      ];
      const surface = buildVolSurface(multiExpiry);
      expect(surface.termStructure.length).toBe(2);
    });
  });
});
