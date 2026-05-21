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

const API_BASE = process.env.CROSSTIDE_API_URL ?? "https://crosstide-worker.workers.dev";

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
      "Get the 12-method technical consensus signal (BUY/SELL/HOLD) with confidence score for a ticker",
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
    description: "Screen stocks by technical criteria (e.g. RSI < 30, price > SMA200)",
    inputSchema: {
      type: "object" as const,
      properties: {
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Field to filter (rsi, price, volume, etc.)" },
              operator: { type: "string", enum: ["gt", "lt", "eq", "gte", "lte"] },
              value: { type: "number" },
            },
            required: ["field", "operator", "value"],
          },
          description: "Array of filter conditions",
        },
        limit: { type: "number", description: "Max results to return (default: 20)" },
      },
      required: ["filters"],
    },
  },
  {
    name: "get_portfolio_risk",
    description: "Calculate portfolio risk metrics: VaR, Sharpe ratio, Sortino ratio, max drawdown",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "Array of ticker symbols in the portfolio",
        },
        weights: {
          type: "array",
          items: { type: "number" },
          description: "Portfolio weights (must sum to 1.0)",
        },
      },
      required: ["symbols", "weights"],
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
      const data = await callApi(`/api/quote/${args.symbol}`);
      return JSON.stringify(data, null, 2);
    }
    case "get_consensus": {
      const data = await callApi(`/api/quote/${args.symbol}`);
      return JSON.stringify(data, null, 2);
    }
    case "get_chart_data": {
      const range = (args.range as string) ?? "3mo";
      const interval = (args.interval as string) ?? "1d";
      const data = await callApi(
        `/api/chart?symbol=${args.symbol}&range=${range}&interval=${interval}`,
      );
      return JSON.stringify(data, null, 2);
    }
    case "get_indicators": {
      const indicators = (args.indicators as string[]).join(",");
      const period = (args.period as number) ?? 14;
      const data = await callApi(
        `/api/chart?symbol=${args.symbol}&range=6mo&interval=1d&indicators=${indicators}&period=${period}`,
      );
      return JSON.stringify(data, null, 2);
    }
    case "run_screener": {
      const res = await fetch(`${API_BASE}/api/screener`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "CrossTide-MCP/0.1.0" },
        body: JSON.stringify({ filters: args.filters, limit: args.limit ?? 20 }),
      });
      if (!res.ok) throw new Error(`Screener error: ${await res.text()}`);
      return JSON.stringify(await res.json(), null, 2);
    }
    case "get_portfolio_risk": {
      const res = await fetch(`${API_BASE}/api/portfolio/rebalance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "CrossTide-MCP/0.1.0" },
        body: JSON.stringify({ symbols: args.symbols, weights: args.weights }),
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
