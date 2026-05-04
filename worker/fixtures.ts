/**
 * Fixture data for preview/staging deployments.
 *
 * When ENVIRONMENT !== "production", API routes serve deterministic
 * fixture data instead of calling external providers. This ensures:
 * - Stable, reproducible preview URLs for QA
 * - No API key requirement for Cloudflare preview branches
 * - Fast responses (no network round-trip)
 */

export interface FixtureQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  name: string;
}

const FIXTURE_QUOTES: Record<string, FixtureQuote> = {
  AAPL: {
    symbol: "AAPL",
    price: 189.84,
    change: 2.31,
    changePercent: 1.23,
    volume: 54_320_100,
    marketCap: 2_950_000_000_000,
    name: "Apple Inc.",
  },
  MSFT: {
    symbol: "MSFT",
    price: 420.72,
    change: -1.45,
    changePercent: -0.34,
    volume: 22_150_300,
    marketCap: 3_120_000_000_000,
    name: "Microsoft Corporation",
  },
  GOOGL: {
    symbol: "GOOGL",
    price: 175.98,
    change: 0.87,
    changePercent: 0.5,
    volume: 18_900_200,
    marketCap: 2_180_000_000_000,
    name: "Alphabet Inc.",
  },
  TSLA: {
    symbol: "TSLA",
    price: 248.42,
    change: 5.6,
    changePercent: 2.31,
    volume: 98_500_400,
    marketCap: 790_000_000_000,
    name: "Tesla, Inc.",
  },
  AMZN: {
    symbol: "AMZN",
    price: 185.6,
    change: -0.22,
    changePercent: -0.12,
    volume: 42_700_100,
    marketCap: 1_930_000_000_000,
    name: "Amazon.com, Inc.",
  },
};

export function getFixtureQuote(symbol: string): FixtureQuote | null {
  return FIXTURE_QUOTES[symbol.toUpperCase()] ?? null;
}

/**
 * Generate deterministic OHLCV candles for a symbol in preview mode.
 */
export function getFixtureChart(
  symbol: string,
  range: string,
): {
  timestamps: number[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
  volumes: number[];
} {
  const basePrice = getFixtureQuote(symbol)?.price ?? 100;
  const count = rangeToCount(range);
  const now = Math.floor(Date.now() / 1000);
  const interval = rangeToInterval(range);

  const timestamps: number[] = [];
  const opens: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const closes: number[] = [];
  const volumes: number[] = [];

  // Seeded pseudo-random (deterministic per symbol)
  let seed = hashCode(symbol);
  const rand = (): number => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed & 0x7fffffff) / 2147483647;
  };

  let price = basePrice * 0.9;
  for (let i = 0; i < count; i++) {
    const t = now - (count - i) * interval;
    const change = (rand() - 0.48) * basePrice * 0.02;
    const open = price;
    price = Math.max(1, price + change);
    const close = price;
    const high = Math.max(open, close) * (1 + rand() * 0.01);
    const low = Math.min(open, close) * (1 - rand() * 0.01);
    const vol = Math.floor(30_000_000 + rand() * 70_000_000);

    timestamps.push(t);
    opens.push(round2(open));
    highs.push(round2(high));
    lows.push(round2(low));
    closes.push(round2(close));
    volumes.push(vol);
  }

  return { timestamps, opens, highs, lows, closes, volumes };
}

export function getFixtureSearch(query: string): { symbol: string; name: string; type: string }[] {
  const q = query.toLowerCase();
  return Object.values(FIXTURE_QUOTES)
    .filter((f) => f.symbol.toLowerCase().includes(q) || f.name.toLowerCase().includes(q))
    .map((f) => ({ symbol: f.symbol, name: f.name, type: "EQUITY" }));
}

/** Returns true if the worker should serve fixtures (non-production). */
export function isPreviewEnvironment(env: { ENVIRONMENT?: string }): boolean {
  return env.ENVIRONMENT !== "production";
}

function rangeToCount(range: string): number {
  switch (range) {
    case "1d":
      return 78;
    case "5d":
      return 390;
    case "1mo":
      return 22;
    case "3mo":
      return 63;
    case "6mo":
      return 126;
    case "1y":
      return 252;
    case "5y":
      return 1260;
    default:
      return 252;
  }
}

function rangeToInterval(range: string): number {
  switch (range) {
    case "1d":
      return 300;
    case "5d":
      return 300;
    default:
      return 86400;
  }
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
