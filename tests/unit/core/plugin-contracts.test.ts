import { describe, it, expect } from "vitest";
import { validatePlugin } from "../../../src/core/plugin-contracts.js";
import type {
  IndicatorPluginContract,
  ChartTypePluginContract,
  DataSourcePluginContract,
} from "../../../src/core/plugin-contracts.js";

describe("plugin-contracts", () => {
  describe("validatePlugin", () => {
    it("should accept a valid indicator plugin", () => {
      const plugin: IndicatorPluginContract = {
        kind: "indicator",
        id: "custom-rsi",
        name: "Custom RSI",
        version: "1.0.0",
        params: [
          { name: "period", label: "Period", type: "number", default: 14, min: 2, max: 100 },
        ],
        compute: () => ({ values: [], overlay: false }),
      };
      expect(validatePlugin(plugin)).toEqual([]);
    });

    it("should accept a valid chart-type plugin", () => {
      const plugin: ChartTypePluginContract = {
        kind: "chart-type",
        id: "kagi-custom",
        name: "Custom Kagi",
        version: "2.0.0",
        transform: () => [],
        render: () => {},
      };
      expect(validatePlugin(plugin)).toEqual([]);
    });

    it("should accept a valid data-source plugin", () => {
      const plugin: DataSourcePluginContract = {
        kind: "data-source",
        id: "alpaca-provider",
        name: "Alpaca Markets",
        version: "1.0.0",
        capabilities: ["quote", "ohlcv", "streaming"],
        requiresApiKey: true,
        fetchQuote: async () => ({
          ticker: "AAPL",
          price: 150,
          change: 1,
          changePercent: 0.67,
          volume: 1000,
          timestamp: Date.now(),
        }),
      };
      expect(validatePlugin(plugin)).toEqual([]);
    });

    it("should reject invalid id", () => {
      const plugin = {
        kind: "indicator" as const,
        id: "Invalid ID!",
        name: "Test",
        version: "1.0.0",
        params: [],
        compute: () => ({ values: [], overlay: false }),
      };
      const errors = validatePlugin(plugin);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("kebab-case");
    });

    it("should reject missing name", () => {
      const plugin = {
        kind: "indicator" as const,
        id: "test",
        name: "",
        version: "1.0.0",
        params: [],
        compute: () => ({ values: [], overlay: false }),
      };
      expect(validatePlugin(plugin)).toContainEqual("Plugin name is required.");
    });

    it("should reject invalid version", () => {
      const plugin = {
        kind: "indicator" as const,
        id: "test",
        name: "Test",
        version: "abc",
        params: [],
        compute: () => ({ values: [], overlay: false }),
      };
      const errors = validatePlugin(plugin);
      expect(errors.some((e) => e.includes("semver"))).toBe(true);
    });

    it("should reject description over 200 chars", () => {
      const plugin = {
        kind: "indicator" as const,
        id: "test",
        name: "Test",
        version: "1.0.0",
        description: "x".repeat(201),
        params: [],
        compute: () => ({ values: [], overlay: false }),
      };
      expect(validatePlugin(plugin).some((e) => e.includes("200"))).toBe(true);
    });

    it("should reject indicator without compute", () => {
      const plugin = {
        kind: "indicator" as const,
        id: "test",
        name: "Test",
        version: "1.0.0",
        params: [],
      } as unknown as IndicatorPluginContract;
      expect(validatePlugin(plugin).some((e) => e.includes("compute()"))).toBe(true);
    });

    it("should reject chart-type without transform", () => {
      const plugin = {
        kind: "chart-type" as const,
        id: "test",
        name: "Test",
        version: "1.0.0",
        render: () => {},
      } as unknown as ChartTypePluginContract;
      expect(validatePlugin(plugin).some((e) => e.includes("transform()"))).toBe(true);
    });

    it("should reject chart-type without render", () => {
      const plugin = {
        kind: "chart-type" as const,
        id: "test",
        name: "Test",
        version: "1.0.0",
        transform: () => [],
      } as unknown as ChartTypePluginContract;
      expect(validatePlugin(plugin).some((e) => e.includes("render()"))).toBe(true);
    });

    it("should reject data-source without capabilities", () => {
      const plugin = {
        kind: "data-source" as const,
        id: "test",
        name: "Test",
        version: "1.0.0",
        capabilities: [],
      } as DataSourcePluginContract;
      expect(validatePlugin(plugin).some((e) => e.includes("capability"))).toBe(true);
    });

    it("should collect multiple errors", () => {
      const plugin = {
        kind: "indicator" as const,
        id: "",
        name: "",
        version: "bad",
        params: [],
      } as unknown as IndicatorPluginContract;
      const errors = validatePlugin(plugin);
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
