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
        description:
          "Returns worker status, API version, binding availability, and configured upstream providers.",
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
          "Returns daily or intraday OHLCV candles. Uses Yahoo Finance first, then configured Finnhub and Massive fallbacks; daily data can also fall back to Stooq and Alpha Vantage. Development without KV uses deterministic demo data.",
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
    "/api/quote/{symbol}": {
      get: {
        operationId: "getQuote",
        summary: "Real-time quote",
        description:
          "Latest price, change and volume for a single symbol. Falls through the configured provider chain and is cached in KV with a market-hours-aware TTL.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "symbol",
            in: "path",
            required: true,
            description: "Ticker symbol (1–12 chars, e.g. AAPL, BRK.A)",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
        ],
        responses: {
          "200": {
            description: "Quote",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/QuoteResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/quotes": {
      get: {
        operationId: "getBatchQuotes",
        summary: "Batch quotes",
        description:
          "Quotes for several symbols in one round trip. Prefer this over parallel calls to /api/quote/{symbol}: it shares a single upstream request and one rate-limit slot.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "symbols",
            in: "query",
            required: true,
            description: "Comma-separated ticker symbols",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Quotes keyed by symbol",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: { $ref: "#/components/schemas/QuoteResponse" },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/fundamentals/{symbol}": {
      get: {
        operationId: "getFundamentals",
        summary: "Fundamental metrics",
        description: "P/E, EPS, market cap, revenue and margin metrics for a single symbol.",
        tags: ["Market Data"],
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
            description: "Fundamental metrics",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/earnings/{symbol}": {
      get: {
        operationId: "getEarnings",
        summary: "Earnings calendar and history",
        description: "Upcoming earnings dates plus historical estimate-versus-actual surprises.",
        tags: ["Market Data"],
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
            description: "Earnings calendar",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/crypto/{id}": {
      get: {
        operationId: "getCrypto",
        summary: "Crypto quote",
        description: "Current price and 24h change for a CoinGecko asset id (e.g. `bitcoin`).",
        tags: ["Market Data"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "CoinGecko asset id, not a ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 64 },
          },
        ],
        responses: {
          "200": {
            description: "Crypto quote",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/forex/{pair}": {
      get: {
        operationId: "getForex",
        summary: "Forex rate",
        description:
          "Exchange rate for a currency pair, sourced from the ECB with a Yahoo fallback.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "pair",
            in: "path",
            required: true,
            description: "Currency pair, e.g. EURUSD",
            schema: { type: "string", minLength: 6, maxLength: 7 },
          },
        ],
        responses: {
          "200": {
            description: "Forex rate",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/seasonality/{symbol}": {
      get: {
        operationId: "getSeasonality",
        summary: "Monthly return seasonality",
        description: "Average return per calendar month across the available history.",
        tags: ["Signals"],
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
            description: "Seasonality by month",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/market-breadth": {
      post: {
        operationId: "getMarketBreadth",
        summary: "Market breadth indicators",
        description:
          "Advance/decline, new highs versus new lows and percentage above moving average for the supplied universe.",
        tags: ["Signals"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Breadth indicators",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/news/sentiment": {
      post: {
        operationId: "scoreNewsSentiment",
        summary: "News sentiment scoring",
        description: "Scores supplied headlines with the Worker's on-device NLP sentiment model.",
        tags: ["Signals"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Sentiment scores",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/portfolio/rebalance": {
      post: {
        operationId: "rebalancePortfolio",
        summary: "Rebalancing trade calculations",
        description:
          "Returns the buy and sell quantities that move holdings back to target weights.",
        tags: ["Portfolio"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Rebalancing trades",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/migrations/status": {
      get: {
        operationId: "getMigrationStatus",
        summary: "D1 migration status",
        description: "Which migrations have been applied to the bound D1 database, and when.",
        tags: ["System"],
        responses: {
          "200": {
            description: "Migration status",
            content: { "application/json": { schema: { type: "object" } } },
          },
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
    "/api/compare": {
      get: {
        operationId: "getCompare",
        summary: "Compare multiple symbols",
        description:
          "Returns normalized multi-symbol comparison data for chart overlays and relative performance views.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "tickers",
            in: "query",
            required: true,
            description: "Comma-separated ticker symbols",
            schema: { type: "string", minLength: 1 },
          },
          {
            name: "range",
            in: "query",
            required: false,
            description: "History range for normalization",
            schema: {
              type: "string",
              enum: ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"],
              default: "3mo",
            },
          },
        ],
        responses: {
          "200": {
            description: "Comparison payload",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/indicators": {
      get: {
        operationId: "getIndicators",
        summary: "Indicator calculations",
        description:
          "Calculates one or more technical indicators from requested symbols and chart windows.",
        tags: ["Signals"],
        parameters: [
          {
            name: "ticker",
            in: "query",
            required: true,
            description: "Ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
          {
            name: "indicators",
            in: "query",
            required: true,
            description: "Comma-separated indicator IDs",
            schema: { type: "string", minLength: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Indicator values",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/economic": {
      get: {
        operationId: "getEconomicData",
        summary: "Economic indicator snapshot",
        description:
          "Returns macro-economic data used by the macro dashboard card and derived indicators.",
        tags: ["Market Data"],
        responses: {
          "200": {
            description: "Economic data snapshot",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/movers": {
      get: {
        operationId: "getMovers",
        summary: "Top gainers and losers",
        description: "Returns ranked market movers for a configurable universe and session window.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum rows per side",
            schema: { type: "integer", minimum: 1, maximum: 200, default: 25 },
          },
        ],
        responses: {
          "200": {
            description: "Top movers",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/sector-heatmap": {
      get: {
        operationId: "getSectorHeatmap",
        summary: "Sector heatmap snapshot",
        description: "Returns sector-level and constituent-level data for the market heatmap card.",
        tags: ["Market Data"],
        responses: {
          "200": {
            description: "Heatmap payload",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/news": {
      get: {
        operationId: "getNews",
        summary: "News feed",
        description: "Returns news articles by ticker, topic and time window for dashboard cards.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "ticker",
            in: "query",
            required: false,
            description: "Optional symbol filter",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Maximum number of items",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "News items",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/fred": {
      get: {
        operationId: "getFredSeries",
        summary: "FRED macro series",
        description:
          "Returns a FRED time series payload for a requested economic series identifier.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "series",
            in: "query",
            required: true,
            description: "FRED series ID",
            schema: { type: "string", minLength: 1, maxLength: 64 },
          },
        ],
        responses: {
          "200": {
            description: "FRED series",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/crypto/search": {
      get: {
        operationId: "searchCryptoAssets",
        summary: "Crypto asset search",
        description: "Searches CoinGecko assets and returns matching ids and symbols.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query",
            schema: { type: "string", minLength: 1, maxLength: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Matching crypto assets",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/crypto/{id}/chart": {
      get: {
        operationId: "getCryptoChart",
        summary: "Crypto OHLCV chart",
        description: "Returns historical crypto OHLCV candles for a CoinGecko asset id.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "CoinGecko asset id",
            schema: { type: "string", minLength: 1, maxLength: 64 },
          },
          {
            name: "range",
            in: "query",
            required: false,
            description: "History range",
            schema: {
              type: "string",
              enum: ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"],
              default: "1mo",
            },
          },
        ],
        responses: {
          "200": {
            description: "Crypto chart payload",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/og": {
      get: {
        operationId: "getOgImageDefault",
        summary: "Default social preview image",
        description:
          "Returns the default SVG social-preview (OG) card when no symbol path is used.",
        tags: ["UI"],
        responses: {
          "200": {
            description: "SVG social card",
            content: { "image/svg+xml": { schema: { type: "string" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/api/dividends/{symbol}": {
      get: {
        operationId: "getDividends",
        summary: "Dividend history",
        description: "Returns historical dividend events and yield metadata for a symbol.",
        tags: ["Market Data"],
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
            description: "Dividend events",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/insiders/{symbol}": {
      get: {
        operationId: "getInsiderTrades",
        summary: "Insider activity",
        description: "Returns recent insider buy/sell filings for a symbol.",
        tags: ["Market Data"],
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
            description: "Insider filings",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/etf/{symbol}/holdings": {
      get: {
        operationId: "getEtfHoldings",
        summary: "ETF holdings",
        description: "Returns top holdings and weights for an ETF symbol.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "symbol",
            in: "path",
            required: true,
            description: "ETF ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
        ],
        responses: {
          "200": {
            description: "ETF holdings",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/regime": {
      get: {
        operationId: "getMarketRegime",
        summary: "Market regime classification",
        description:
          "Returns market regime features and the current classified regime for requested symbols.",
        tags: ["Signals"],
        parameters: [
          {
            name: "ticker",
            in: "query",
            required: true,
            description: "Ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
          {
            name: "lookback",
            in: "query",
            required: false,
            description: "Lookback period in bars",
            schema: { type: "integer", minimum: 20, maximum: 1000, default: 252 },
          },
        ],
        responses: {
          "200": {
            description: "Regime classification",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/anomaly": {
      get: {
        operationId: "getAnomalySignals",
        summary: "Price anomaly detection",
        description: "Returns anomaly scores and events from statistical outlier detection models.",
        tags: ["Signals"],
        parameters: [
          {
            name: "ticker",
            in: "query",
            required: true,
            description: "Ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
          {
            name: "window",
            in: "query",
            required: false,
            description: "Rolling window size",
            schema: { type: "integer", minimum: 10, maximum: 500, default: 60 },
          },
        ],
        responses: {
          "200": {
            description: "Anomaly output",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/archive": {
      get: {
        operationId: "listArchivedOhlcv",
        summary: "Archived OHLCV index",
        description: "Returns available archived symbols and metadata from cold storage.",
        tags: ["System"],
        responses: {
          "200": {
            description: "Archive index",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "503": {
            description: "Archive storage not available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/archive/{ticker}": {
      get: {
        operationId: "getArchivedOhlcv",
        summary: "Archived OHLCV series",
        description: "Returns long-range archived candles for a single symbol.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "ticker",
            in: "path",
            required: true,
            description: "Ticker symbol",
            schema: { type: "string", minLength: 1, maxLength: 12 },
          },
          {
            name: "range",
            in: "query",
            required: false,
            description: "History range",
            schema: {
              type: "string",
              enum: ["1y", "2y", "5y", "10y", "20y", "max"],
              default: "max",
            },
          },
        ],
        responses: {
          "200": {
            description: "Archived candle payload",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "503": {
            description: "Archive storage not available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/alpaca/quote/{symbol}": {
      get: {
        operationId: "getAlpacaQuote",
        summary: "Alpaca quote fallback",
        description: "Returns a quote from Alpaca Markets for the provided symbol.",
        tags: ["Market Data"],
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
            description: "Alpaca quote",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/alpaca/bars/{symbol}": {
      get: {
        operationId: "getAlpacaBars",
        summary: "Alpaca bars fallback",
        description: "Returns OHLCV bars from Alpaca Markets for the provided symbol.",
        tags: ["Market Data"],
        parameters: [
          {
            name: "symbol",
            in: "path",
            required: true,
            description: "Ticker symbol",
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
              default: "1mo",
            },
          },
          {
            name: "interval",
            in: "query",
            required: false,
            description: "Bar interval",
            schema: {
              type: "string",
              enum: ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"],
              default: "1d",
            },
          },
        ],
        responses: {
          "200": {
            description: "Alpaca bar payload",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "502": { $ref: "#/components/responses/UpstreamFailure" },
        },
      },
    },
    "/api/portfolio/analytics": {
      post: {
        operationId: "analyzePortfolio",
        summary: "Portfolio analytics",
        description:
          "Calculates aggregate portfolio metrics including P/L, concentration and risk measures.",
        tags: ["Portfolio"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Portfolio analytics output",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/auth/challenge": {
      get: {
        operationId: "getAuthChallenge",
        summary: "Issue WebAuthn challenge",
        description: "Issues a one-time challenge for passkey registration or authentication.",
        tags: ["System"],
        security: [],
        responses: {
          "200": {
            description: "Challenge payload",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/auth/register": {
      post: {
        operationId: "registerPasskey",
        summary: "Register passkey credential",
        description: "Registers a WebAuthn credential and stores its public-key metadata in D1.",
        tags: ["System"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "credentialId",
                  "rawId",
                  "attestationObject",
                  "clientDataJSON",
                  "userHandle",
                ],
                properties: {
                  credentialId: { type: "string" },
                  rawId: { type: "string" },
                  attestationObject: { type: "string" },
                  clientDataJSON: { type: "string" },
                  publicKey: { type: "string" },
                  userHandle: { type: "string" },
                  rpId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Credential registered",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { description: "Credential already registered" },
          "503": { description: "Auth storage unavailable" },
        },
      },
    },
    "/api/auth/authenticate": {
      post: {
        operationId: "authenticatePasskey",
        summary: "Authenticate passkey assertion",
        description: "Verifies a WebAuthn assertion and updates credential usage metadata.",
        tags: ["System"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["credentialId", "authenticatorData", "clientDataJSON", "signature"],
                properties: {
                  credentialId: { type: "string" },
                  authenticatorData: { type: "string" },
                  clientDataJSON: { type: "string" },
                  signature: { type: "string" },
                  userHandle: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Authentication success",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { description: "Authentication failed" },
          "503": { description: "Auth storage unavailable" },
        },
      },
    },
    "/api/sync": {
      get: {
        operationId: "getEncryptedSyncBlob",
        summary: "Read encrypted sync payload",
        description:
          "Returns encrypted user sync state for a credential identifier. The server treats payloads as opaque ciphertext.",
        tags: ["System"],
        security: [{ CredentialIdQuery: [] }],
        parameters: [
          {
            name: "credentialId",
            in: "query",
            required: true,
            description: "Credential identifier",
            schema: { type: "string", minLength: 1, maxLength: 512 },
          },
        ],
        responses: {
          "200": {
            description: "Encrypted sync blob",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "503": { description: "Sync storage unavailable" },
        },
      },
      put: {
        operationId: "putEncryptedSyncBlob",
        summary: "Write encrypted sync payload",
        description:
          "Stores or replaces encrypted sync state using optimistic version checks keyed by credentialId.",
        tags: ["System"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["credentialId", "encryptedBlob", "version"],
                properties: {
                  credentialId: { type: "string" },
                  encryptedBlob: { type: "string" },
                  version: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Sync payload stored",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { description: "Credential not found" },
          "409": { description: "Version conflict" },
          "503": { description: "Sync storage unavailable" },
        },
      },
    },
    "/api/keys": {
      get: {
        operationId: "listUserKeys",
        summary: "List stored BYOK metadata",
        description: "Lists encrypted API-key metadata for the authenticated credential.",
        tags: ["System"],
        security: [{ CredentialHeader: [] }],
        responses: {
          "200": {
            description: "Stored key metadata",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "401": { description: "Missing or invalid credential" },
          "503": { description: "Database unavailable" },
        },
      },
      post: {
        operationId: "storeUserKey",
        summary: "Store encrypted BYOK secret",
        description:
          "Stores an encrypted API key for a provider. The server stores ciphertext only.",
        tags: ["System"],
        security: [{ CredentialHeader: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["provider", "encrypted_key", "iv"],
                properties: {
                  provider: { type: "string" },
                  encrypted_key: { type: "string" },
                  iv: { type: "string" },
                  label: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Key stored",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { description: "Missing or invalid credential" },
          "503": { description: "Database unavailable" },
        },
      },
    },
    "/api/keys/get": {
      get: {
        operationId: "getUserKey",
        summary: "Retrieve encrypted provider key",
        description:
          "Returns encrypted key material for a provider under the authenticated credential.",
        tags: ["System"],
        security: [{ CredentialHeader: [] }],
        parameters: [
          {
            name: "provider",
            in: "query",
            required: true,
            description: "Provider identifier",
            schema: { type: "string", minLength: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Encrypted provider key",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { description: "Missing or invalid credential" },
          "404": { description: "Provider key not found" },
          "503": { description: "Database unavailable" },
        },
      },
    },
    "/api/keys/{id}": {
      delete: {
        operationId: "deleteUserKey",
        summary: "Delete encrypted provider key",
        description:
          "Deletes an encrypted provider key by numeric id for the authenticated credential.",
        tags: ["System"],
        security: [{ CredentialHeader: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Numeric key identifier",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Key deleted",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { description: "Missing or invalid credential" },
          "404": { description: "Key not found" },
          "503": { description: "Database unavailable" },
        },
      },
    },
    "/api/monte-carlo": {
      post: {
        operationId: "runMonteCarlo",
        summary: "Monte Carlo portfolio simulation",
        description:
          "Simulates portfolio value paths from a mean/stddev return model and returns percentile bands, loss probability, and up to 5 sample paths.",
        tags: ["Portfolio"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Simulation percentiles and sample paths",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/pairs": {
      post: {
        operationId: "analyzePairsTrade",
        summary: "Pairs trading analysis",
        description:
          "Computes spread, z-score series, hedge ratio, and entry/exit signals for two cointegrated price series.",
        tags: ["Signals"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Pairs signal output",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/factor-model": {
      post: {
        operationId: "analyzeFactorModel",
        summary: "Fama-French factor attribution",
        description:
          "Estimates alpha, market beta, SMB, and HML factor exposures and decomposes portfolio returns by factor contribution.",
        tags: ["Portfolio"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Factor attribution output",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/fundamentals/batch": {
      post: {
        operationId: "getFundamentalsBatch",
        summary: "Batch fundamentals lookup",
        description:
          "Fetches fundamentals for up to 20 symbols in one request, returning partial results if some symbols fail.",
        tags: ["Market Data"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Per-symbol fundamentals and errors",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/signal-dsl/execute-script": {
      post: {
        operationId: "executeSignalDslScript",
        summary: "Execute a multi-statement signal DSL script",
        description:
          "Runs a Signal DSL script supporting `let`, `for` loops, arrays, index access, and the `plot()` builtin for custom overlays.",
        tags: ["Signals"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": {
            description: "Script execution result",
            content: { "application/json": { schema: { type: "object" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/csp-report": {
      post: {
        operationId: "reportCspViolation",
        summary: "CSP violation report sink",
        description:
          "Accepts browser-generated Content-Security-Policy violation reports for monitoring. Rate-limited at 10 reports/min per IP.",
        tags: ["System"],
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "204": { description: "Report accepted" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "405": { description: "Method not allowed" },
        },
      },
    },
    "/api/ws/{symbol}": {
      get: {
        operationId: "streamTickerWs",
        summary: "WebSocket ticker fan-out",
        description:
          "Upgrades to a WebSocket connection that streams live ticker updates for the given symbol via a Durable Object fan-out.",
        tags: ["Market Data"],
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
          "101": { description: "Switching Protocols — WebSocket upgrade" },
          "503": {
            description: "WebSocket streaming not available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/favicon.ico": {
      get: {
        operationId: "getFavicon",
        summary: "Favicon no-op",
        description: "Always returns 204 No Content; the app has no favicon asset.",
        tags: ["System"],
        security: [],
        responses: {
          "204": { description: "No content" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      CredentialHeader: {
        type: "apiKey",
        in: "header",
        name: "X-Credential-ID",
        description: "Credential identifier header required by BYOK routes.",
      },
      CredentialIdQuery: {
        type: "apiKey",
        in: "query",
        name: "credentialId",
        description: "Credential identifier used by sync read route.",
      },
    },
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
      QuoteResponse: {
        type: "object",
        required: ["symbol", "price"],
        properties: {
          symbol: { type: "string" },
          price: { type: "number" },
          change: { type: "number", description: "Absolute change since the previous close" },
          changePercent: { type: "number" },
          previousClose: { type: "number" },
          volume: { type: "number" },
          currency: { type: "string" },
          source: { type: "string", description: "Provider that served this quote" },
          timestamp: { type: "string", format: "date-time" },
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
      UpstreamFailure: {
        description: "Every configured provider failed or timed out",
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
    { name: "Market Data", description: "Quotes, OHLCV candles, fundamentals and ticker search" },
    { name: "Signals", description: "Consensus, screener, and signal DSL execution" },
    { name: "Portfolio", description: "Holdings analytics and rebalancing" },
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
