/**
 * CrossTide Worker API — generated TypeScript client types (P16).
 * DO NOT EDIT — regenerate with: npm run gen:api-types
 *
 * Source: worker/routes/openapi.ts (OpenAPI 3.1.0)
 * Generated: 2026-05-05
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
}
