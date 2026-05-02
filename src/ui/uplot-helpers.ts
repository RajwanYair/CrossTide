/**
 * uPlot inline chart helpers (H16).
 *
 * Lightweight configuration builders for rendering static inline sparkline
 * and mini-charts using uPlot.  These helpers produce uPlot-compatible
 * options objects and data arrays from domain candle data, without importing
 * uPlot itself (the consumer lazy-loads it).
 *
 * Exports:
 *   - `buildSparklineOpts(width, height)` — minimal sparkline config
 *   - `buildMiniChartOpts(width, height, opts?)` — mini OHLC bar config
 *   - `candlesToUplotData(candles)` — transform candles to uPlot data format
 *   - `closesToSparklineData(timestamps, closes)` — timestamps + closes
 *   - `priceRangeFromData(data)` — extract min/max for Y-axis
 *   - `sparklineColor(startPrice, endPrice)` — green/red based on direction
 *   - `buildVolumeBarSeries()` — volume bar overlay series config
 *
 * uPlot expects data as an array-of-arrays (column-major): [[timestamps], [series1], …].
 * Timestamps must be Unix seconds (not milliseconds).
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface UplotSeriesConfig {
  label?: string;
  stroke?: string;
  fill?: string;
  width?: number;
  scale?: string;
  spanGaps?: boolean;
  paths?: null;
  points?: { show: boolean };
  band?: boolean;
}

export interface UplotAxisConfig {
  show: boolean;
  stroke?: string;
  size?: number;
  scale?: string;
}

export interface UplotScaleConfig {
  range?: [number, number] | ((u: unknown, min: number, max: number) => [number, number]);
  auto?: boolean;
}

export interface UplotOpts {
  width: number;
  height: number;
  cursor?: { show: boolean };
  legend?: { show: boolean };
  select?: { show: boolean };
  series: UplotSeriesConfig[];
  axes: UplotAxisConfig[];
  scales?: Record<string, UplotScaleConfig>;
}

export type UplotData = number[][];

export interface SparklineOptions {
  /** Line colour override (default: auto from price direction). */
  color?: string;
  /** Fill under the line (default: transparent). */
  fillAlpha?: number;
  /** Line width in CSS pixels (default: 1.5). */
  lineWidth?: number;
}

export interface MiniChartOptions {
  /** Up-candle body colour (default: "#26a69a"). */
  upColor?: string;
  /** Down-candle body colour (default: "#ef5350"). */
  downColor?: string;
  /** Show volume bars (default: false). */
  showVolume?: boolean;
}

export interface PriceRange {
  min: number;
  max: number;
  /** Padding-adjusted range for Y-axis. */
  paddedMin: number;
  paddedMax: number;
}

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_UP_COLOR = "#26a69a";
const DEFAULT_DOWN_COLOR = "#ef5350";
const DEFAULT_LINE_WIDTH = 1.5;
const RANGE_PAD = 0.02; // 2% padding on Y-axis

// ── Sparkline ─────────────────────────────────────────────────────────────

/**
 * Determine sparkline colour from price direction.
 * Green if price went up or flat, red if it went down.
 */
export function sparklineColor(startPrice: number, endPrice: number): string {
  return endPrice >= startPrice ? DEFAULT_UP_COLOR : DEFAULT_DOWN_COLOR;
}

/**
 * Build minimal uPlot options for a sparkline (single line, no axes/cursor).
 */
export function buildSparklineOpts(
  width: number,
  height: number,
  opts: SparklineOptions = {},
): UplotOpts {
  const lineWidth = opts.lineWidth ?? DEFAULT_LINE_WIDTH;
  const color = opts.color ?? DEFAULT_UP_COLOR;
  const fill =
    opts.fillAlpha != null && opts.fillAlpha > 0 ? hexToRgba(color, opts.fillAlpha) : undefined;

  return {
    width,
    height,
    cursor: { show: false },
    legend: { show: false },
    select: { show: false },
    series: [
      {}, // x-axis (timestamp) series — always empty config in uPlot
      {
        stroke: color,
        fill: fill ?? "transparent",
        width: lineWidth,
        spanGaps: true,
        points: { show: false },
      },
    ],
    axes: [{ show: false }, { show: false }],
  };
}

/**
 * Build uPlot options for a mini OHLC chart with optional volume bars.
 */
export function buildMiniChartOpts(
  width: number,
  height: number,
  opts: MiniChartOptions = {},
): UplotOpts {
  const series: UplotSeriesConfig[] = [
    {}, // x-axis
    { label: "Open", stroke: opts.upColor ?? DEFAULT_UP_COLOR, points: { show: false } },
    { label: "High", stroke: opts.upColor ?? DEFAULT_UP_COLOR, points: { show: false } },
    { label: "Low", stroke: opts.downColor ?? DEFAULT_DOWN_COLOR, points: { show: false } },
    { label: "Close", stroke: opts.upColor ?? DEFAULT_UP_COLOR, points: { show: false } },
  ];

  const axes: UplotAxisConfig[] = [{ show: false }, { show: false }];

  const result: UplotOpts = {
    width,
    height,
    cursor: { show: false },
    legend: { show: false },
    select: { show: false },
    series,
    axes,
  };

  if (opts.showVolume) {
    series.push(buildVolumeBarSeries());
    axes.push({ show: false, scale: "vol" });
    result.scales = {
      vol: { auto: true },
    };
  }

  return result;
}

// ── Data transformers ─────────────────────────────────────────────────────

/**
 * Convert an array of timestamps (ms) and close prices to uPlot data format.
 * uPlot expects timestamps in **seconds**.
 */
export function closesToSparklineData(
  timestamps: readonly number[],
  closes: readonly number[],
): UplotData {
  const len = Math.min(timestamps.length, closes.length);
  const ts: number[] = new Array(len);
  const vals: number[] = new Array(len);
  for (let i = 0; i < len; i++) {
    ts[i] = Math.floor(timestamps[i] / 1000);
    vals[i] = closes[i];
  }
  return [ts, vals];
}

/**
 * Convert OHLCV candle objects to uPlot column-major data.
 * Returns [[timestamps], [opens], [highs], [lows], [closes], [volumes]].
 */
export function candlesToUplotData(
  candles: readonly {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[],
): UplotData {
  const len = candles.length;
  const ts: number[] = new Array(len);
  const opens: number[] = new Array(len);
  const highs: number[] = new Array(len);
  const lows: number[] = new Array(len);
  const closes: number[] = new Array(len);
  const volumes: number[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const c = candles[i];
    ts[i] = Math.floor(c.timestamp / 1000);
    opens[i] = c.open;
    highs[i] = c.high;
    lows[i] = c.low;
    closes[i] = c.close;
    volumes[i] = c.volume;
  }

  return [ts, opens, highs, lows, closes, volumes];
}

/**
 * Compute min/max price range from a uPlot close-price data column.
 * Adds 2% padding on both sides for comfortable display.
 */
export function priceRangeFromData(prices: readonly number[]): PriceRange {
  if (prices.length === 0) {
    return { min: 0, max: 0, paddedMin: 0, paddedMax: 0 };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const p of prices) {
    if (p < min) min = p;
    if (p > max) max = p;
  }
  const spread = max - min || 1;
  const pad = spread * RANGE_PAD;
  return {
    min,
    max,
    paddedMin: min - pad,
    paddedMax: max + pad,
  };
}

// ── Volume bars ───────────────────────────────────────────────────────────

/** Build a volume bar overlay series config. */
export function buildVolumeBarSeries(): UplotSeriesConfig {
  return {
    label: "Volume",
    scale: "vol",
    stroke: "rgba(100,100,100,0.3)",
    fill: "rgba(100,100,100,0.15)",
    width: 0,
    points: { show: false },
    band: false,
    paths: null,
  };
}

// ── Utility ───────────────────────────────────────────────────────────────

/**
 * Convert a hex colour (#rrggbb or #rgb) to rgba() string.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const sanitised = hex.replace("#", "");
  const full =
    sanitised.length === 3
      ? sanitised[0] + sanitised[0] + sanitised[1] + sanitised[1] + sanitised[2] + sanitised[2]
      : sanitised;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
