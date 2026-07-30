/**
 * CrossTide Worker API — generated TypeScript client types (P16).
 * DO NOT EDIT — regenerate with: npm run gen:api-types
 *
 * Source: worker/routes/openapi.ts (OpenAPI 3.1.0)
 * Generated: 2026-07-30
 */

export interface HealthResponse {
  readonly status: "ok";
  readonly version: string;
  readonly timestamp: string;
  readonly environment: string;
}

export interface CandleRecord {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface SearchResult {
  readonly ticker: string;
  readonly name?: string;
  readonly exchange?: string;
  readonly score?: number;
}

export interface ScreenerRequest {
  readonly tickers: string[];
  readonly methods?:
    | "Micho"
    | "RSI"
    | "MACD"
    | "Bollinger"
    | "Stochastic"
    | "OBV"
    | "ADX"
    | "CCI"
    | "SAR"
    | "WilliamsR"
    | "MFI"
    | "SuperTrend"[];
  readonly filter?: "BUY" | "SELL" | "NEUTRAL" | "ALL";
}

export interface ScreenerResult {
  readonly ticker: string;
  readonly consensus: "BUY" | "SELL" | "NEUTRAL";
  readonly strength?: number;
  readonly signals?: {
    readonly method?: string;
    readonly direction?: string;
  }[];
}

export interface SignalDslRequest {
  readonly expression: string;
  readonly candles: CandleRecord[];
}

export interface SignalDslResult {
  readonly direction: "BUY" | "SELL" | "NEUTRAL";
  readonly value?: number;
  readonly meta?: Record<string, unknown>;
}

export interface AlertHistoryResponse {
  readonly history: AlertHistoryRow[];
  readonly count: number;
}

export interface AlertHistoryRow {
  readonly id: string;
  readonly rule_id: string;
  readonly user_id: string;
  readonly ticker: string;
  readonly condition: string;
  readonly value: number;
  readonly fired_at: string;
}

export interface QuoteResponse {
  readonly symbol: string;
  readonly price: number;
  readonly change?: number;
  readonly changePercent?: number;
  readonly previousClose?: number;
  readonly volume?: number;
  readonly currency?: string;
  readonly source?: string;
  readonly timestamp?: string;
}

export interface ErrorResponse {
  readonly error: string;
}

export interface ApiRoutes {
  /** GET /api/health */
  readonly getHealth: {
    readonly request: never;
    readonly response: HealthResponse;
  };
  /** GET /api/chart */
  readonly getChart: {
    readonly request: never;
    readonly response: {
      readonly ticker: string;
      readonly candles: CandleRecord[];
    };
  };
  /** GET /api/search */
  readonly searchTickers: {
    readonly request: never;
    readonly response: {
      readonly results: SearchResult[];
    };
  };
  /** POST /api/screener */
  readonly runScreener: {
    readonly request: ScreenerRequest;
    readonly response: {
      readonly results: ScreenerResult[];
    };
  };
  /** GET /api/og/{symbol} */
  readonly getOgImage: {
    readonly request: never;
    readonly response: unknown;
  };
  /** POST /api/signal-dsl/execute */
  readonly executeSignalDsl: {
    readonly request: SignalDslRequest;
    readonly response: SignalDslResult;
  };
  /** GET /openapi.json */
  readonly getOpenApiSpec: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/alerts/history */
  readonly getAlertHistory: {
    readonly request: never;
    readonly response: AlertHistoryResponse;
  };
  /** GET /api/quote/{symbol} */
  readonly getQuote: {
    readonly request: never;
    readonly response: QuoteResponse;
  };
  /** GET /api/quotes */
  readonly getBatchQuotes: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/fundamentals/{symbol} */
  readonly getFundamentals: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/earnings/{symbol} */
  readonly getEarnings: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/crypto/{id} */
  readonly getCrypto: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/forex/{pair} */
  readonly getForex: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/seasonality/{symbol} */
  readonly getSeasonality: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** POST /api/market-breadth */
  readonly getMarketBreadth: {
    readonly request: Record<string, unknown>;
    readonly response: Record<string, unknown>;
  };
  /** POST /api/news/sentiment */
  readonly scoreNewsSentiment: {
    readonly request: Record<string, unknown>;
    readonly response: Record<string, unknown>;
  };
  /** POST /api/portfolio/rebalance */
  readonly rebalancePortfolio: {
    readonly request: Record<string, unknown>;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/migrations/status */
  readonly getMigrationStatus: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/compare */
  readonly getCompare: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/indicators */
  readonly getIndicators: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/economic */
  readonly getEconomicData: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/movers */
  readonly getMovers: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/sector-heatmap */
  readonly getSectorHeatmap: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/news */
  readonly getNews: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/fred */
  readonly getFredSeries: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/crypto/search */
  readonly searchCryptoAssets: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/crypto/{id}/chart */
  readonly getCryptoChart: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/og */
  readonly getOgImageDefault: {
    readonly request: never;
    readonly response: unknown;
  };
  /** GET /api/dividends/{symbol} */
  readonly getDividends: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/insiders/{symbol} */
  readonly getInsiderTrades: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/etf/{symbol}/holdings */
  readonly getEtfHoldings: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/regime */
  readonly getMarketRegime: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/anomaly */
  readonly getAnomalySignals: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/archive */
  readonly listArchivedOhlcv: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/archive/{ticker} */
  readonly getArchivedOhlcv: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/alpaca/quote/{symbol} */
  readonly getAlpacaQuote: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** GET /api/alpaca/bars/{symbol} */
  readonly getAlpacaBars: {
    readonly request: never;
    readonly response: Record<string, unknown>;
  };
  /** POST /api/portfolio/analytics */
  readonly analyzePortfolio: {
    readonly request: Record<string, unknown>;
    readonly response: Record<string, unknown>;
  };
}
