#!/usr/bin/env node
/**
 * CrossTide MCP Server (S4).
 *
 * Exposes CrossTide's financial analysis capabilities as MCP tools
 * for AI agents (Claude, GPT, etc.).
 *
 * Tools:
 *   - get_quote: Real-time stock quote
 *   - get_consensus: 12-method consensus signal
 *   - run_screener: Technical/fundamental screen
 *   - get_chart_data: OHLCV candle data
 *   - get_indicators: Calculate technical indicators
 *   - get_portfolio_risk: Portfolio risk metrics
 *
 * Transport: stdio (standard MCP transport)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.CROSSTIDE_API_URL ?? "http://localhost:8787";

const TOOLS = [
  {
    name: "get_quote",
    description: "Get a real-time stock quote including price, change, volume, and market cap",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol (e.g. AAPL, MSFT)" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_consensus",
    description:
      "Get the technical consensus signal and score for a ticker from the CrossTide screener",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_chart_data",
    description: "Get OHLCV candlestick data for charting and analysis",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol" },
        range: {
          type: "string",
          description: "Time range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max",
          enum: ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"],
        },
        interval: {
          type: "string",
          description: "Candle interval: 1m, 5m, 15m, 1h, 1d, 1wk, 1mo",
          enum: ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"],
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_indicators",
    description:
      "Calculate technical indicators (SMA, EMA, RSI, MACD, Bollinger, etc.) for a ticker",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol" },
        indicators: {
          type: "array",
          items: { type: "string" },
          description:
            "Indicator names: sma, ema, rsi, macd, bollinger, stochastic, adx, obv, vwap, atr",
        },
        period: { type: "number", description: "Lookback period (default: 14)" },
      },
      required: ["symbol", "indicators"],
    },
  },
  {
    name: "run_screener",
    description: "Screen a ticker list by RSI, ADX, consensus, and fundamental criteria",
    inputSchema: {
      type: "object" as const,
      properties: {
        tickers: {
          type: "array",
          items: { type: "string" },
          description: "One to 50 ticker symbols",
        },
        minRsi: { type: "number", description: "Minimum RSI from 0 to 100" },
        maxRsi: { type: "number", description: "Maximum RSI from 0 to 100" },
        minAdx: { type: "number", description: "Minimum ADX from 0 to 100" },
        consensus: { type: "string", enum: ["BUY", "SELL", "NEUTRAL"] },
        minPe: { type: "number" },
        maxPe: { type: "number" },
        minMarketCap: { type: "number", description: "Minimum market cap in USD" },
        maxMarketCap: { type: "number", description: "Maximum market cap in USD" },
        minDividendYield: { type: "number", description: "Minimum decimal dividend yield" },
        minProfitMargin: { type: "number", description: "Minimum decimal profit margin" },
      },
      required: ["tickers"],
    },
  },
  {
    name: "get_portfolio_analytics",
    description: "Calculate portfolio allocation, profit and loss, and concentration analytics",
    inputSchema: {
      type: "object" as const,
      properties: {
        holdings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              shares: { type: "number" },
              costBasis: { type: "number", description: "Per-share cost basis" },
            },
            required: ["symbol", "shares", "costBasis"],
          },
        },
      },
      required: ["holdings"],
    },
  },
] as const;

async function callApi(path: string): Promise<unknown> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "CrossTide-MCP/0.1.0" },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function handleTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "get_quote": {
      const data = await callApi(`/api/quote/${encodeURIComponent(String(args.symbol))}`);
      return JSON.stringify(data, null, 2);
    }
    case "get_consensus": {
      const res = await fetch(`${API_BASE}/api/screener`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "CrossTide-MCP/0.1.0" },
        body: JSON.stringify({ tickers: [args.symbol] }),
      });
      if (!res.ok) throw new Error(`Consensus error ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { readonly rows?: readonly unknown[] };
      return JSON.stringify(data.rows?.[0] ?? null, null, 2);
    }
    case "get_chart_data": {
      const range = (args.range as string) ?? "3mo";
      const interval = (args.interval as string) ?? "1d";
      const data = await callApi(
        `/api/chart?ticker=${encodeURIComponent(String(args.symbol))}&range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`,
      );
      return JSON.stringify(data, null, 2);
    }
    case "get_indicators": {
      const indicators = (args.indicators as string[]).join(",");
      const period = (args.period as number) ?? 14;
      const data = await callApi(
        `/api/indicators?symbol=${encodeURIComponent(String(args.symbol))}&indicators=${encodeURIComponent(indicators)}&range=6mo&period=${encodeURIComponent(String(period))}`,
      );
      return JSON.stringify(data, null, 2);
    }
    case "run_screener": {
      const res = await fetch(`${API_BASE}/api/screener`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "CrossTide-MCP/0.1.0" },
        body: JSON.stringify(args),
      });
      if (!res.ok) throw new Error(`Screener error: ${await res.text()}`);
      return JSON.stringify(await res.json(), null, 2);
    }
    case "get_portfolio_analytics": {
      const res = await fetch(`${API_BASE}/api/portfolio/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "CrossTide-MCP/0.1.0" },
        body: JSON.stringify({ holdings: args.holdings }),
      });
      if (!res.ok) throw new Error(`Portfolio error: ${await res.text()}`);
      return JSON.stringify(await res.json(), null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function main(): Promise<void> {
  const server = new Server(
    { name: "crosstide", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...TOOLS],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      const result = await handleTool(name, (args as Record<string, unknown>) ?? {});
      return { content: [{ type: "text", text: result }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

void main();
