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
import { isToolName, parseToolArgs, TOOLS } from "./tool-manifest.js";

const API_BASE = process.env.CROSSTIDE_API_URL ?? "http://localhost:8787";

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

async function postApi(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "CrossTide-MCP/0.1.0" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Arguments arrive from an MCP client that may ignore the advertised schema, so
 * every branch parses them first. Only validated, explicitly named fields are
 * forwarded upstream — `run_screener` previously relayed the whole argument bag.
 */
async function handleTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (!isToolName(name)) {
    throw new Error(`Unknown tool: ${name}`);
  }

  switch (name) {
    case "get_quote": {
      const { symbol } = parseToolArgs("get_quote", args);
      return JSON.stringify(await callApi(`/api/quote/${encodeURIComponent(symbol)}`), null, 2);
    }
    case "get_consensus": {
      const { symbol } = parseToolArgs("get_consensus", args);
      const data = (await postApi("/api/screener", { tickers: [symbol] })) as {
        readonly rows?: readonly unknown[];
      };
      return JSON.stringify(data.rows?.[0] ?? null, null, 2);
    }
    case "get_chart_data": {
      const { symbol, range, interval } = parseToolArgs("get_chart_data", args);
      const query = new URLSearchParams({ ticker: symbol, range, interval });
      return JSON.stringify(await callApi(`/api/chart?${query.toString()}`), null, 2);
    }
    case "get_indicators": {
      const { symbol, indicators, period } = parseToolArgs("get_indicators", args);
      const query = new URLSearchParams({
        symbol,
        indicators: indicators.join(","),
        range: "6mo",
        period: String(period),
      });
      return JSON.stringify(await callApi(`/api/indicators?${query.toString()}`), null, 2);
    }
    case "run_screener": {
      const criteria = parseToolArgs("run_screener", args);
      return JSON.stringify(await postApi("/api/screener", criteria), null, 2);
    }
    case "get_portfolio_analytics": {
      const { holdings } = parseToolArgs("get_portfolio_analytics", args);
      return JSON.stringify(await postApi("/api/portfolio/analytics", { holdings }), null, 2);
    }
    default:
      throw new Error(`Unhandled tool: ${String(name)}`);
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
