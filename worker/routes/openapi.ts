/**
 * GET /openapi.json (G10)
 *
 * Returns an OpenAPI 3.1 document that describes all CrossTide Worker routes.
 * The spec is derived directly from the Hono route definitions and kept in
 * sync manually; no code-generation dependency is required.
 */

/** OpenAPI 3.1 spec for the CrossTide Worker API. */
export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "CrossTide Worker API",
    description:
      "Cloudflare Worker API for CrossTide — OHLCV data, ticker search, technical screener, consensus signals, and OG images.",
    version: "1.0.0",
    contact: {
      url: "https://github.com/RajwanYair/CrossTide",
    },
    license: {
      name: "MIT",
      url: "https://github.com/RajwanYair/CrossTide/blob/main/LICENSE",
    },
  },
  servers: [
    {
      url: "https://api.crosstide.pages.dev",
      description: "Production (Cloudflare Workers)",
    },
    {
      url: "http://localhost:8787",
      description: "Local Wrangler dev server",
    },
  ],
  paths: {
    "/api/health": {
      get: {
        operationId: "getHealth",
        summary: "Worker health check",
        description: "Returns the current worker status, API version, and ISO timestamp.",
        tags: ["System"],
        responses: {
          "200": {
            description: "Worker is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/chart": {
      get: {
        operationId: "getChart",
        summary: "OHLCV candlestick data",
        description:
          "Returns daily (or intraday) OHLCV candles for the given ticker. Proxies to Yahoo Finance; falls back to synthetic seeded data in development.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "ticker",
            in: "query",
            required: true,
            description: "Ticker symbol (1–12 chars, e.g. AAPL, BRK.A)",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
          {
            name: "range",
            in: "query",
            required: false,
            description: "History range",
            schema: {
              type: "string",
              enum: ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"],
              default: "1y",
            },
          },
          {
            name: "interval",
            in: "query",
            required: false,
            description: "Candle interval",
            schema: {
              type: "string",
              enum: ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"],
              default: "1d",
            },
          },
        ],
        responses: {
          "200": {
            description: "Array of OHLCV candles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ticker", "candles"],
                  properties: {
                    ticker: { type: "string" },
                    candles: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CandleRecord" },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/search": {
      get: {
        operationId: "searchTickers",
        summary: "Ticker fuzzy search",
        description: "Returns matching ticker symbols for the given query string.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query (partial ticker or company name)",
            schema: { type: "string", minLength: 1, maxLength: 100 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum results to return (1–50)",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Matching ticker results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["results"],
                  properties: {
                    results: {
                      type: "array",
                      items: { $ref: "#/components/schemas/SearchResult" },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/screener": {
      post: {
        operationId: "runScreener",
        summary: "Technical screener",
        description:
          "Screens the provided tickers against technical method signals and an optional consensus filter. Returns each ticker's latest consensus and individual method results.",
        tags: ["Signals"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ScreenerRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Screener results per ticker",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["results"],
                  properties: {
                    results: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ScreenerResult" },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/og/{symbol}": {
      get: {
        operationId: "getOgImage",
        summary: "Social preview image",
        description: "Returns an SVG social-preview (OG) card for the given ticker symbol.",
        tags: ["UI"],
        parameters: [
          {
            name: "symbol",
            in: "path",
            required: true,
            description: "Ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
        ],
        responses: {
          "200": {
            description: "SVG social card",
            content: { "image/svg+xml": { schema: { type: "string" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/signal-dsl/execute": {
      post: {
        operationId: "executeSignalDsl",
        summary: "Execute a signal DSL expression",
        description:
          "Evaluates a CrossTide Signal DSL expression against the supplied OHLCV candles and returns a signal direction (BUY / SELL / NEUTRAL).",
        tags: ["Signals"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignalDslRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Signal evaluation result",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignalDslResult" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/openapi.json": {
      get: {
        operationId: "getOpenApiSpec",
        summary: "OpenAPI 3.1 specification",
        description: "Returns this document.",
        tags: ["System"],
        responses: {
          "200": {
            description: "OpenAPI JSON document",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
    "/api/alerts/history": {
      get: {
        operationId: "getAlertHistory",
        summary: "Query fired alert history",
        description:
          "Returns a chronological list of previously fired alerts from D1, filtered by user. Supports optional ticker and date-range filters.",
        tags: ["Alerts"],
        parameters: [
          {
            name: "user_id",
            in: "query",
            required: true,
            description: "User ID to query history for",
            schema: { type: "string", minLength: 1 },
          },
          {
            name: "ticker",
            in: "query",
            required: false,
            description: "Filter by ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
          {
            name: "since",
            in: "query",
            required: false,
            description: "ISO 8601 lower bound for fired_at",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum results (1–200, default 50)",
            schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
          },
        ],
        responses: {
          "200": {
            description: "Alert history results",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AlertHistoryResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "503": {
            description: "Database not available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        required: ["status", "version", "timestamp", "environment"],
        properties: {
          status: { type: "string", enum: ["ok"] },
          version: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
          environment: { type: "string" },
        },
      },
      CandleRecord: {
        type: "object",
        required: ["date", "open", "high", "low", "close", "volume"],
        properties: {
          date: { type: "string", format: "date" },
          open: { type: "number" },
          high: { type: "number" },
          low: { type: "number" },
          close: { type: "number" },
          volume: { type: "number" },
        },
      },
      SearchResult: {
        type: "object",
        required: ["ticker"],
        properties: {
          ticker: { type: "string" },
          name: { type: "string" },
          exchange: { type: "string" },
          score: { type: "number" },
        },
      },
      ScreenerRequest: {
        type: "object",
        required: ["tickers"],
        properties: {
          tickers: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 200,
          },
          methods: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "Micho",
                "RSI",
                "MACD",
                "Bollinger",
                "Stochastic",
                "OBV",
                "ADX",
                "CCI",
                "SAR",
                "WilliamsR",
                "MFI",
                "SuperTrend",
              ],
            },
          },
          filter: {
            type: "string",
            enum: ["BUY", "SELL", "NEUTRAL", "ALL"],
            default: "ALL",
          },
        },
      },
      ScreenerResult: {
        type: "object",
        required: ["ticker", "consensus"],
        properties: {
          ticker: { type: "string" },
          consensus: {
            type: "string",
            enum: ["BUY", "SELL", "NEUTRAL"],
          },
          strength: { type: "number", minimum: 0, maximum: 1 },
          signals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                method: { type: "string" },
                direction: { type: "string" },
              },
            },
          },
        },
      },
      SignalDslRequest: {
        type: "object",
        required: ["expression", "candles"],
        properties: {
          expression: { type: "string", description: "Signal DSL expression" },
          candles: {
            type: "array",
            items: { $ref: "#/components/schemas/CandleRecord" },
          },
        },
      },
      SignalDslResult: {
        type: "object",
        required: ["direction"],
        properties: {
          direction: { type: "string", enum: ["BUY", "SELL", "NEUTRAL"] },
          value: { type: "number" },
          meta: { type: "object" },
        },
      },
      AlertHistoryResponse: {
        type: "object",
        required: ["history", "count"],
        properties: {
          history: {
            type: "array",
            items: { $ref: "#/components/schemas/AlertHistoryRow" },
          },
          count: { type: "integer" },
        },
      },
      AlertHistoryRow: {
        type: "object",
        required: ["id", "rule_id", "user_id", "ticker", "condition", "value", "fired_at"],
        properties: {
          id: { type: "string" },
          rule_id: { type: "string" },
          user_id: { type: "string" },
          ticker: { type: "string" },
          condition: { type: "string", description: "JSON-encoded alert condition" },
          value: { type: "number", description: "Actual value that triggered the alert" },
          fired_at: { type: "string", format: "date-time" },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Invalid request parameters",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      RateLimited: {
        description: "Rate limit exceeded",
        headers: {
          "Retry-After": {
            schema: { type: "integer" },
            description: "Seconds until the rate limit window resets",
          },
        },
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
  tags: [
    { name: "System", description: "Health and meta endpoints" },
    { name: "Market Data", description: "OHLCV candles and ticker search" },
    { name: "Signals", description: "Consensus, screener, and signal DSL execution" },
    { name: "Alerts", description: "Alert rules and fired alert history" },
    { name: "UI", description: "Generated UI assets" },
  ],
} as const;

/** Handler for GET /openapi.json */
export function handleOpenApiSpec(): Response {
  return new Response(JSON.stringify(OPENAPI_SPEC, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
