/**
 * Static ticker catalog — offline fuzzy lookup for the ticker search box.
 *
 * Pure data + pure matcher. The autocomplete widget calls the live provider
 * chain first; when that fails (CORS-restricted static hosting such as GitHub
 * Pages, offline, provider outage) it falls back to this catalog so typing a
 * symbol always surfaces similar tickers instead of an empty dropdown.
 *
 * Covers the instrument types CrossTide renders: stocks, ETFs, crypto, forex
 * pairs and indices.
 */

/** Instrument classes represented in the static catalog. */
export type CatalogInstrument = "stock" | "etf" | "crypto" | "forex" | "index";

/** A single catalog row. */
export interface TickerCatalogEntry {
  readonly symbol: string;
  readonly name: string;
  readonly exchange: string;
  readonly type: CatalogInstrument;
}

const CATALOG: readonly TickerCatalogEntry[] = [
  // ── Mega/large-cap US equities ──────────────────────────────────────────
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc. Class A", exchange: "NASDAQ", type: "stock" },
  { symbol: "GOOG", name: "Alphabet Inc. Class C", exchange: "NASDAQ", type: "stock" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock" },
  { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "BRK-B", name: "Berkshire Hathaway Inc. Class B", exchange: "NYSE", type: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", type: "stock" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "MA", name: "Mastercard Incorporated", exchange: "NYSE", type: "stock" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", exchange: "NYSE", type: "stock" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", type: "stock" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "PG", name: "The Procter & Gamble Company", exchange: "NYSE", type: "stock" },
  { symbol: "HD", name: "The Home Depot, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "CVX", name: "Chevron Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "LLY", name: "Eli Lilly and Company", exchange: "NYSE", type: "stock" },
  { symbol: "ABBV", name: "AbbVie Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "MRK", name: "Merck & Co., Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "PEP", name: "PepsiCo, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE", type: "stock" },
  { symbol: "COST", name: "Costco Wholesale Corporation", exchange: "NASDAQ", type: "stock" },
  { symbol: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "CRM", name: "Salesforce, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", type: "stock" },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", exchange: "NASDAQ", type: "stock" },
  { symbol: "TXN", name: "Texas Instruments Incorporated", exchange: "NASDAQ", type: "stock" },
  { symbol: "MU", name: "Micron Technology, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "AMAT", name: "Applied Materials, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "ARM", name: "Arm Holdings plc", exchange: "NASDAQ", type: "stock" },
  { symbol: "SMCI", name: "Super Micro Computer, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "IBM", name: "International Business Machines", exchange: "NYSE", type: "stock" },
  { symbol: "CSCO", name: "Cisco Systems, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "NOW", name: "ServiceNow, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "SHOP", name: "Shopify Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "UBER", name: "Uber Technologies, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "ABNB", name: "Airbnb, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "COIN", name: "Coinbase Global, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "SQ", name: "Block, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "PYPL", name: "PayPal Holdings, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE", type: "stock" },
  { symbol: "BA", name: "The Boeing Company", exchange: "NYSE", type: "stock" },
  { symbol: "CAT", name: "Caterpillar Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "GE", name: "GE Aerospace", exchange: "NYSE", type: "stock" },
  { symbol: "F", name: "Ford Motor Company", exchange: "NYSE", type: "stock" },
  { symbol: "GM", name: "General Motors Company", exchange: "NYSE", type: "stock" },
  { symbol: "RIVN", name: "Rivian Automotive, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "LCID", name: "Lucid Group, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "NIO", name: "NIO Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "BAC", name: "Bank of America Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "WFC", name: "Wells Fargo & Company", exchange: "NYSE", type: "stock" },
  { symbol: "GS", name: "The Goldman Sachs Group, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "MS", name: "Morgan Stanley", exchange: "NYSE", type: "stock" },
  { symbol: "C", name: "Citigroup Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "MRNA", name: "Moderna, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "T", name: "AT&T Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "VZ", name: "Verizon Communications Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "NKE", name: "NIKE, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "SBUX", name: "Starbucks Corporation", exchange: "NASDAQ", type: "stock" },
  { symbol: "MCD", name: "McDonald's Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "TGT", name: "Target Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "LOW", name: "Lowe's Companies, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "SPOT", name: "Spotify Technology S.A.", exchange: "NYSE", type: "stock" },
  { symbol: "SNOW", name: "Snowflake Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "CRWD", name: "CrowdStrike Holdings, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "PANW", name: "Palo Alto Networks, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "DDOG", name: "Datadog, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "NET", name: "Cloudflare, Inc.", exchange: "NYSE", type: "stock" },
  { symbol: "MDB", name: "MongoDB, Inc.", exchange: "NASDAQ", type: "stock" },
  { symbol: "ASML", name: "ASML Holding N.V.", exchange: "NASDAQ", type: "stock" },
  { symbol: "TSM", name: "Taiwan Semiconductor Manufacturing", exchange: "NYSE", type: "stock" },
  { symbol: "BABA", name: "Alibaba Group Holding Limited", exchange: "NYSE", type: "stock" },
  { symbol: "SONY", name: "Sony Group Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "SAP", name: "SAP SE", exchange: "NYSE", type: "stock" },
  { symbol: "NVO", name: "Novo Nordisk A/S", exchange: "NYSE", type: "stock" },
  { symbol: "TM", name: "Toyota Motor Corporation", exchange: "NYSE", type: "stock" },
  { symbol: "HSBC", name: "HSBC Holdings plc", exchange: "NYSE", type: "stock" },
  { symbol: "SHEL", name: "Shell plc", exchange: "NYSE", type: "stock" },
  { symbol: "BP", name: "BP p.l.c.", exchange: "NYSE", type: "stock" },

  // ── ETFs ────────────────────────────────────────────────────────────────
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE Arca", type: "etf" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", exchange: "NYSE Arca", type: "etf" },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF", exchange: "NYSE Arca", type: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", type: "etf" },
  {
    symbol: "DIA",
    name: "SPDR Dow Jones Industrial Average ETF",
    exchange: "NYSE Arca",
    type: "etf",
  },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", exchange: "NYSE Arca", type: "etf" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", exchange: "NYSE Arca", type: "etf" },
  {
    symbol: "VEA",
    name: "Vanguard FTSE Developed Markets ETF",
    exchange: "NYSE Arca",
    type: "etf",
  },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", exchange: "NYSE Arca", type: "etf" },
  { symbol: "EFA", name: "iShares MSCI EAFE ETF", exchange: "NYSE Arca", type: "etf" },
  {
    symbol: "AGG",
    name: "iShares Core U.S. Aggregate Bond ETF",
    exchange: "NYSE Arca",
    type: "etf",
  },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", exchange: "NASDAQ", type: "etf" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", exchange: "NASDAQ", type: "etf" },
  {
    symbol: "HYG",
    name: "iShares iBoxx High Yield Corporate Bond ETF",
    exchange: "NYSE Arca",
    type: "etf",
  },
  { symbol: "GLD", name: "SPDR Gold Shares", exchange: "NYSE Arca", type: "etf" },
  { symbol: "SLV", name: "iShares Silver Trust", exchange: "NYSE Arca", type: "etf" },
  { symbol: "USO", name: "United States Oil Fund", exchange: "NYSE Arca", type: "etf" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", exchange: "NYSE Arca", type: "etf" },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", exchange: "NYSE Arca", type: "etf" },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund", exchange: "NYSE Arca", type: "etf" },
  {
    symbol: "XLV",
    name: "Health Care Select Sector SPDR Fund",
    exchange: "NYSE Arca",
    type: "etf",
  },
  {
    symbol: "XLY",
    name: "Consumer Discretionary Select Sector SPDR",
    exchange: "NYSE Arca",
    type: "etf",
  },
  { symbol: "XLI", name: "Industrial Select Sector SPDR Fund", exchange: "NYSE Arca", type: "etf" },
  { symbol: "SMH", name: "VanEck Semiconductor ETF", exchange: "NASDAQ", type: "etf" },
  { symbol: "SOXX", name: "iShares Semiconductor ETF", exchange: "NASDAQ", type: "etf" },
  { symbol: "ARKK", name: "ARK Innovation ETF", exchange: "NYSE Arca", type: "etf" },
  { symbol: "SCHD", name: "Schwab U.S. Dividend Equity ETF", exchange: "NYSE Arca", type: "etf" },
  { symbol: "VYM", name: "Vanguard High Dividend Yield ETF", exchange: "NYSE Arca", type: "etf" },
  { symbol: "VIG", name: "Vanguard Dividend Appreciation ETF", exchange: "NYSE Arca", type: "etf" },
  {
    symbol: "VXUS",
    name: "Vanguard Total International Stock ETF",
    exchange: "NASDAQ",
    type: "etf",
  },
  { symbol: "IBIT", name: "iShares Bitcoin Trust ETF", exchange: "NASDAQ", type: "etf" },
  { symbol: "FBTC", name: "Fidelity Wise Origin Bitcoin Fund", exchange: "NYSE Arca", type: "etf" },
  {
    symbol: "VXX",
    name: "iPath Series B S&P 500 VIX Short-Term Futures",
    exchange: "BATS",
    type: "etf",
  },

  // ── Crypto (Yahoo `-USD` convention) ────────────────────────────────────
  { symbol: "BTC-USD", name: "Bitcoin USD", exchange: "CCC", type: "crypto" },
  { symbol: "ETH-USD", name: "Ethereum USD", exchange: "CCC", type: "crypto" },
  { symbol: "SOL-USD", name: "Solana USD", exchange: "CCC", type: "crypto" },
  { symbol: "XRP-USD", name: "XRP USD", exchange: "CCC", type: "crypto" },
  { symbol: "BNB-USD", name: "BNB USD", exchange: "CCC", type: "crypto" },
  { symbol: "ADA-USD", name: "Cardano USD", exchange: "CCC", type: "crypto" },
  { symbol: "DOGE-USD", name: "Dogecoin USD", exchange: "CCC", type: "crypto" },
  { symbol: "AVAX-USD", name: "Avalanche USD", exchange: "CCC", type: "crypto" },
  { symbol: "DOT-USD", name: "Polkadot USD", exchange: "CCC", type: "crypto" },
  { symbol: "MATIC-USD", name: "Polygon USD", exchange: "CCC", type: "crypto" },
  { symbol: "LINK-USD", name: "Chainlink USD", exchange: "CCC", type: "crypto" },
  { symbol: "LTC-USD", name: "Litecoin USD", exchange: "CCC", type: "crypto" },
  { symbol: "TRX-USD", name: "TRON USD", exchange: "CCC", type: "crypto" },
  { symbol: "SHIB-USD", name: "Shiba Inu USD", exchange: "CCC", type: "crypto" },
  { symbol: "UNI-USD", name: "Uniswap USD", exchange: "CCC", type: "crypto" },
  { symbol: "ATOM-USD", name: "Cosmos USD", exchange: "CCC", type: "crypto" },
  { symbol: "XLM-USD", name: "Stellar USD", exchange: "CCC", type: "crypto" },
  { symbol: "BCH-USD", name: "Bitcoin Cash USD", exchange: "CCC", type: "crypto" },

  // ── Forex (Yahoo `=X` convention) ───────────────────────────────────────
  { symbol: "EURUSD=X", name: "EUR/USD", exchange: "CCY", type: "forex" },
  { symbol: "GBPUSD=X", name: "GBP/USD", exchange: "CCY", type: "forex" },
  { symbol: "USDJPY=X", name: "USD/JPY", exchange: "CCY", type: "forex" },
  { symbol: "USDCHF=X", name: "USD/CHF", exchange: "CCY", type: "forex" },
  { symbol: "AUDUSD=X", name: "AUD/USD", exchange: "CCY", type: "forex" },
  { symbol: "USDCAD=X", name: "USD/CAD", exchange: "CCY", type: "forex" },
  { symbol: "NZDUSD=X", name: "NZD/USD", exchange: "CCY", type: "forex" },
  { symbol: "USDILS=X", name: "USD/ILS", exchange: "CCY", type: "forex" },
  { symbol: "USDCNY=X", name: "USD/CNY", exchange: "CCY", type: "forex" },
  { symbol: "USDINR=X", name: "USD/INR", exchange: "CCY", type: "forex" },

  // ── Indices (Yahoo `^` convention) ──────────────────────────────────────
  { symbol: "^GSPC", name: "S&P 500", exchange: "SNP", type: "index" },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", exchange: "DJI", type: "index" },
  { symbol: "^IXIC", name: "NASDAQ Composite", exchange: "NASDAQ", type: "index" },
  { symbol: "^RUT", name: "Russell 2000", exchange: "RUSSELL", type: "index" },
  { symbol: "^VIX", name: "CBOE Volatility Index", exchange: "CBOE", type: "index" },
  { symbol: "^FTSE", name: "FTSE 100", exchange: "FTSE", type: "index" },
  { symbol: "^GDAXI", name: "DAX Performance Index", exchange: "XETRA", type: "index" },
  { symbol: "^N225", name: "Nikkei 225", exchange: "OSA", type: "index" },
  { symbol: "^HSI", name: "Hang Seng Index", exchange: "HKG", type: "index" },
  { symbol: "^TA125.TA", name: "TA-125", exchange: "TLV", type: "index" },
];

/** Every catalog row, frozen. */
export function getTickerCatalog(): readonly TickerCatalogEntry[] {
  return CATALOG;
}

/**
 * Symbol formats CrossTide accepts, matching the Worker's ticker guard:
 * plain equities (`MSFT`), share classes (`BRK.B`), crypto pairs (`BTC-USD`),
 * indices (`^GSPC`) and forex pairs (`EURUSD=X`).
 */
const SUPPORTED_SYMBOL_RE = /^\^?[A-Z0-9][A-Z0-9.-]{0,13}(?:=[A-Z])?$/;

/** True when `symbol` is a well-formed ticker the app can subscribe to. */
export function isSupportedSymbol(symbol: string): boolean {
  return SUPPORTED_SYMBOL_RE.test(symbol.trim().toUpperCase());
}

const EXACT_SCORE = 1000;
const SYMBOL_PREFIX_SCORE = 500;
const SYMBOL_CONTAINS_SCORE = 200;
const NAME_PREFIX_SCORE = 120;
const NAME_WORD_SCORE = 80;
const NAME_CONTAINS_SCORE = 40;

/**
 * Score a catalog entry against a normalized (upper-case, trimmed) query.
 * Returns 0 when the entry does not match at all.
 */
function scoreEntry(entry: TickerCatalogEntry, query: string): number {
  const symbol = entry.symbol.toUpperCase();
  const name = entry.name.toUpperCase();

  if (symbol === query) return EXACT_SCORE;

  let score = 0;
  if (symbol.startsWith(query)) {
    score = SYMBOL_PREFIX_SCORE - symbol.length;
  } else if (symbol.includes(query)) {
    score = SYMBOL_CONTAINS_SCORE - symbol.length;
  }

  if (name.startsWith(query)) {
    score = Math.max(score, NAME_PREFIX_SCORE);
  } else if (name.split(/[\s.,/-]+/).some((w) => w.startsWith(query))) {
    score = Math.max(score, NAME_WORD_SCORE);
  } else if (name.includes(query)) {
    score = Math.max(score, NAME_CONTAINS_SCORE);
  }

  return score;
}

/**
 * Find catalog entries similar to `query`, best match first.
 *
 * Matching is case-insensitive across both symbol and company name, so
 * `app`, `AAPL` and `Apple` all resolve to `AAPL`.
 */
export function searchTickerCatalog(query: string, limit = 8): readonly TickerCatalogEntry[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const scored: Array<{ entry: TickerCatalogEntry; score: number }> = [];
  for (const entry of CATALOG) {
    const score = scoreEntry(entry, q);
    if (score > 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.symbol.localeCompare(b.entry.symbol));
  return scored.slice(0, limit).map((s) => s.entry);
}
