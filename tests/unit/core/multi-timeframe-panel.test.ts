import { describe, it, expect } from "vitest";
import {
  createTimeframeGroup,
  computeConfluence,
  mapRange,
  estimateBars,
  type PanelTrend,
} from "../../../src/core/multi-timeframe-panel.js";

describe("multi-timeframe-panel", () => {
  const defaultPanels = [
    { interval: "1h" as const, label: "Hourly" },
    { interval: "1d" as const, label: "Daily" },
    { interval: "1w" as const, label: "Weekly" },
  ];

  describe("createTimeframeGroup", () => {
    it("creates group with 2-4 panels", () => {
      const group = createTimeframeGroup({ ticker: "AAPL", panels: defaultPanels });
      expect(group.panels).toHaveLength(3);
      expect(group.sync).toBeDefined();
      group.dispose();
    });

    it("rejects fewer than 2 panels", () => {
      expect(() =>
        createTimeframeGroup({
          ticker: "AAPL",
          panels: [{ interval: "1d", label: "Daily" }],
        }),
      ).toThrow(/at least 2/i);
    });

    it("rejects more than maxPanels", () => {
      const panels = [
        { interval: "1m", label: "1" },
        { interval: "5m", label: "2" },
        { interval: "1h", label: "3" },
      ];
      expect(() => createTimeframeGroup({ ticker: "AAPL", panels, maxPanels: 2 })).toThrow(
        /at most 2/i,
      );
    });
  });

  describe("range sync", () => {
    it("broadcasts mapped ranges to non-source panels", () => {
      const group = createTimeframeGroup({ ticker: "AAPL", panels: defaultPanels });
      const received: Array<{ interval: string; from: number; to: number }> = [];

      group.onRangeSync((interval, range) => {
        received.push({ interval, from: range.from, to: range.to });
      });

      // Simulate daily chart visible range
      const dayStart = 1_700_000_000;
      const dayEnd = dayStart + 86400 * 30; // 30 days
      group.onRangeChange("1d", { from: dayStart, to: dayEnd });

      // Should notify hourly and weekly panels (not daily)
      expect(received).toHaveLength(2);
      expect(received.map((r) => r.interval).sort()).toEqual(["1h", "1w"]);
      group.dispose();
    });

    it("does not fire after dispose", () => {
      const group = createTimeframeGroup({ ticker: "AAPL", panels: defaultPanels });
      let count = 0;
      group.onRangeSync(() => count++);
      group.dispose();
      group.onRangeChange("1d", { from: 0, to: 86400 });
      expect(count).toBe(0);
    });

    it("unsubscribe removes handler", () => {
      const group = createTimeframeGroup({ ticker: "AAPL", panels: defaultPanels });
      let count = 0;
      const unsub = group.onRangeSync(() => count++);
      unsub();
      group.onRangeChange("1d", { from: 0, to: 86400 });
      expect(count).toBe(0);
      group.dispose();
    });
  });

  describe("mapRange", () => {
    it("snaps range to target interval boundaries", () => {
      const range = { from: 1_700_000_123, to: 1_700_100_456 };
      const mapped = mapRange(range, "1d");
      // 86400 = 1 day; should snap to day boundaries
      expect(mapped.from % 86400).toBe(0);
      expect(mapped.to % 86400).toBe(0);
    });

    it("passes through unknown intervals unchanged", () => {
      const range = { from: 1000, to: 2000 };
      const mapped = mapRange(range, "custom");
      expect(mapped).toEqual(range);
    });
  });

  describe("estimateBars", () => {
    it("computes bar count for known interval", () => {
      const range = { from: 0, to: 86400 * 7 }; // 7 days
      expect(estimateBars(range, "1d")).toBe(7);
    });

    it("returns 0 for unknown interval", () => {
      expect(estimateBars({ from: 0, to: 1000 }, "custom")).toBe(0);
    });

    it("returns at least 1 for tiny ranges", () => {
      expect(estimateBars({ from: 0, to: 1 }, "1d")).toBe(1);
    });
  });

  describe("computeConfluence", () => {
    it("returns aligned when all trends agree", () => {
      const trends: PanelTrend[] = [
        { interval: "1h", direction: "up" },
        { interval: "1d", direction: "up" },
        { interval: "1w", direction: "up" },
      ];
      const result = computeConfluence(trends);
      expect(result.status).toBe("aligned");
      expect(result.dominantDirection).toBe("up");
    });

    it("returns opposed when trends disagree", () => {
      const trends: PanelTrend[] = [
        { interval: "1h", direction: "up" },
        { interval: "1d", direction: "down" },
      ];
      const result = computeConfluence(trends);
      expect(result.status).toBe("opposed");
    });

    it("returns mixed when all neutral", () => {
      const trends: PanelTrend[] = [
        { interval: "1h", direction: "neutral" },
        { interval: "1d", direction: "neutral" },
      ];
      const result = computeConfluence(trends);
      expect(result.status).toBe("mixed");
    });

    it("returns mixed for empty trends", () => {
      const result = computeConfluence([]);
      expect(result.status).toBe("mixed");
      expect(result.dominantDirection).toBe("neutral");
    });

    it("aligned with one neutral still aligns non-neutral", () => {
      const trends: PanelTrend[] = [
        { interval: "1h", direction: "down" },
        { interval: "1d", direction: "down" },
        { interval: "1w", direction: "neutral" },
      ];
      const result = computeConfluence(trends);
      expect(result.status).toBe("aligned");
      expect(result.dominantDirection).toBe("down");
    });
  });

  describe("updateTrends integration", () => {
    it("delegates to computeConfluence", () => {
      const group = createTimeframeGroup({ ticker: "AAPL", panels: defaultPanels });
      const result = group.updateTrends([
        { interval: "1h", direction: "up" },
        { interval: "1d", direction: "up" },
        { interval: "1w", direction: "down" },
      ]);
      expect(result.status).toBe("opposed");
      group.dispose();
    });
  });
});
