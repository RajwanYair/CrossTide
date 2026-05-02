/**
 * Unit tests for uPlot inline chart helpers (H16).
 */
import { describe, it, expect } from "vitest";
import {
  buildSparklineOpts,
  buildMiniChartOpts,
  closesToSparklineData,
  candlesToUplotData,
  priceRangeFromData,
  sparklineColor,
  buildVolumeBarSeries,
  hexToRgba,
} from "../../../src/ui/uplot-helpers";

// ── Test data ─────────────────────────────────────────────────────────────

const TIMESTAMPS_MS = [1700000000000, 1700086400000, 1700172800000];
const CLOSES = [100, 105, 103];

const CANDLES = [
  { timestamp: 1700000000000, open: 100, high: 105, low: 99, close: 103, volume: 5000 },
  { timestamp: 1700086400000, open: 103, high: 108, low: 101, close: 107, volume: 6000 },
  { timestamp: 1700172800000, open: 107, high: 110, low: 104, close: 106, volume: 4500 },
];

// ── sparklineColor ────────────────────────────────────────────────────────

describe("sparklineColor", () => {
  it("returns green for upward move", () => {
    expect(sparklineColor(100, 105)).toBe("#26a69a");
  });

  it("returns red for downward move", () => {
    expect(sparklineColor(105, 100)).toBe("#ef5350");
  });

  it("returns green for flat (same price)", () => {
    expect(sparklineColor(100, 100)).toBe("#26a69a");
  });
});

// ── buildSparklineOpts ────────────────────────────────────────────────────

describe("buildSparklineOpts", () => {
  it("returns correct dimensions", () => {
    const opts = buildSparklineOpts(200, 50);
    expect(opts.width).toBe(200);
    expect(opts.height).toBe(50);
  });

  it("hides cursor, legend, and select", () => {
    const opts = buildSparklineOpts(200, 50);
    expect(opts.cursor).toEqual({ show: false });
    expect(opts.legend).toEqual({ show: false });
    expect(opts.select).toEqual({ show: false });
  });

  it("has two series (timestamp + line)", () => {
    const opts = buildSparklineOpts(200, 50);
    expect(opts.series).toHaveLength(2);
    expect(opts.series[0]).toEqual({});
  });

  it("hides both axes", () => {
    const opts = buildSparklineOpts(200, 50);
    expect(opts.axes).toHaveLength(2);
    expect(opts.axes[0].show).toBe(false);
    expect(opts.axes[1].show).toBe(false);
  });

  it("applies custom colour", () => {
    const opts = buildSparklineOpts(100, 30, { color: "#ff0000" });
    expect(opts.series[1].stroke).toBe("#ff0000");
  });

  it("applies custom line width", () => {
    const opts = buildSparklineOpts(100, 30, { lineWidth: 3 });
    expect(opts.series[1].width).toBe(3);
  });

  it("applies fill alpha when provided", () => {
    const opts = buildSparklineOpts(100, 30, { fillAlpha: 0.2, color: "#26a69a" });
    expect(opts.series[1].fill).toBe("rgba(38,166,154,0.2)");
  });

  it("uses transparent fill when fillAlpha is 0", () => {
    const opts = buildSparklineOpts(100, 30, { fillAlpha: 0 });
    expect(opts.series[1].fill).toBe("transparent");
  });

  it("defaults to no fill when fillAlpha omitted", () => {
    const opts = buildSparklineOpts(100, 30);
    expect(opts.series[1].fill).toBe("transparent");
  });
});

// ── buildMiniChartOpts ────────────────────────────────────────────────────

describe("buildMiniChartOpts", () => {
  it("has 5 series (timestamp + OHLC) without volume", () => {
    const opts = buildMiniChartOpts(300, 100);
    expect(opts.series).toHaveLength(5);
  });

  it("adds volume series when showVolume is true", () => {
    const opts = buildMiniChartOpts(300, 100, { showVolume: true });
    expect(opts.series).toHaveLength(6);
    expect(opts.series[5].label).toBe("Volume");
    expect(opts.series[5].scale).toBe("vol");
  });

  it("adds vol scale when showVolume is true", () => {
    const opts = buildMiniChartOpts(300, 100, { showVolume: true });
    expect(opts.scales).toBeDefined();
    expect(opts.scales!["vol"]).toEqual({ auto: true });
  });

  it("applies custom up/down colours", () => {
    const opts = buildMiniChartOpts(300, 100, {
      upColor: "#00ff00",
      downColor: "#ff0000",
    });
    expect(opts.series[1].stroke).toBe("#00ff00");
    expect(opts.series[3].stroke).toBe("#ff0000");
  });

  it("hides cursor, legend, select", () => {
    const opts = buildMiniChartOpts(300, 100);
    expect(opts.cursor).toEqual({ show: false });
    expect(opts.legend).toEqual({ show: false });
  });
});

// ── closesToSparklineData ─────────────────────────────────────────────────

describe("closesToSparklineData", () => {
  it("converts ms timestamps to seconds", () => {
    const [ts, vals] = closesToSparklineData(TIMESTAMPS_MS, CLOSES);
    expect(ts[0]).toBe(1700000000);
    expect(ts[1]).toBe(1700086400);
    expect(vals).toEqual(CLOSES);
  });

  it("handles empty arrays", () => {
    const [ts, vals] = closesToSparklineData([], []);
    expect(ts).toHaveLength(0);
    expect(vals).toHaveLength(0);
  });

  it("truncates to shorter array length", () => {
    const [ts, vals] = closesToSparklineData([1000, 2000, 3000], [10, 20]);
    expect(ts).toHaveLength(2);
    expect(vals).toHaveLength(2);
  });
});

// ── candlesToUplotData ────────────────────────────────────────────────────

describe("candlesToUplotData", () => {
  it("returns 6 columns", () => {
    const data = candlesToUplotData(CANDLES);
    expect(data).toHaveLength(6);
  });

  it("converts timestamps from ms to seconds", () => {
    const data = candlesToUplotData(CANDLES);
    expect(data[0][0]).toBe(1700000000);
  });

  it("maps OHLCV columns correctly", () => {
    const data = candlesToUplotData(CANDLES);
    expect(data[1][0]).toBe(100); // open
    expect(data[2][0]).toBe(105); // high
    expect(data[3][0]).toBe(99); // low
    expect(data[4][0]).toBe(103); // close
    expect(data[5][0]).toBe(5000); // volume
  });

  it("handles empty candle array", () => {
    const data = candlesToUplotData([]);
    expect(data).toHaveLength(6);
    expect(data[0]).toHaveLength(0);
  });
});

// ── priceRangeFromData ────────────────────────────────────────────────────

describe("priceRangeFromData", () => {
  it("computes min/max from prices", () => {
    const range = priceRangeFromData([100, 105, 99, 103]);
    expect(range.min).toBe(99);
    expect(range.max).toBe(105);
  });

  it("adds 2% padding", () => {
    const range = priceRangeFromData([100, 200]);
    const spread = 100;
    const pad = spread * 0.02;
    expect(range.paddedMin).toBe(100 - pad);
    expect(range.paddedMax).toBe(200 + pad);
  });

  it("handles single value (uses spread of 1)", () => {
    const range = priceRangeFromData([50]);
    expect(range.min).toBe(50);
    expect(range.max).toBe(50);
    expect(range.paddedMin).toBe(50 - 0.02);
    expect(range.paddedMax).toBe(50 + 0.02);
  });

  it("returns zeros for empty array", () => {
    const range = priceRangeFromData([]);
    expect(range.min).toBe(0);
    expect(range.max).toBe(0);
    expect(range.paddedMin).toBe(0);
    expect(range.paddedMax).toBe(0);
  });
});

// ── buildVolumeBarSeries ──────────────────────────────────────────────────

describe("buildVolumeBarSeries", () => {
  it("uses vol scale", () => {
    const series = buildVolumeBarSeries();
    expect(series.scale).toBe("vol");
  });

  it("has transparent fill", () => {
    const series = buildVolumeBarSeries();
    expect(series.fill).toContain("rgba");
  });

  it("sets paths to null", () => {
    const series = buildVolumeBarSeries();
    expect(series.paths).toBeNull();
  });
});

// ── hexToRgba ─────────────────────────────────────────────────────────────

describe("hexToRgba", () => {
  it("converts 6-char hex", () => {
    expect(hexToRgba("#26a69a", 0.5)).toBe("rgba(38,166,154,0.5)");
  });

  it("converts 3-char hex", () => {
    expect(hexToRgba("#f00", 1)).toBe("rgba(255,0,0,1)");
  });

  it("handles no hash prefix", () => {
    expect(hexToRgba("ff0000", 0.3)).toBe("rgba(255,0,0,0.3)");
  });
});
