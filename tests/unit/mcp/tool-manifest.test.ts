/**
 * Guards the MCP tool manifest (E3).
 *
 * The MCP server had no tests at all while shipping unchecked casts over
 * client-supplied arguments. These assertions are derived from the artifacts —
 * the advertised manifest, the Valibot schemas and the Worker's own route
 * table — so a tool that gains an argument, loses a validator or points at a
 * route that no longer exists fails here rather than at runtime in an agent.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isToolName,
  parseToolArgs,
  TOOL_ROUTES,
  TOOL_SCHEMAS,
  TOOLS,
} from "../../../mcp-server/src/tool-manifest.js";

const toolNames = TOOLS.map((tool) => tool.name);

function registeredWorkerRoutes(): Set<string> {
  const source = readFileSync(resolve(process.cwd(), "worker/index.ts"), "utf8");
  const routes = new Set<string>();
  const pattern = /^app\.(get|post|put|delete|patch)\("([^"]+)"/gm;
  for (const match of source.matchAll(pattern)) {
    routes.add(`${match[1].toUpperCase()} ${match[2]}`);
  }
  return routes;
}

describe("MCP tool manifest", () => {
  it("advertises the tools the server can actually dispatch", () => {
    expect(toolNames.length).toBeGreaterThan(0);
    expect([...toolNames].sort()).toEqual(Object.keys(TOOL_SCHEMAS).sort());
  });

  it("names a Worker route for every advertised tool", () => {
    expect(Object.keys(TOOL_ROUTES).sort()).toEqual([...toolNames].sort());
  });

  it("calls only routes the Worker registers", () => {
    const registered = registeredWorkerRoutes();
    expect(registered.size).toBeGreaterThan(50);

    const missing = Object.entries(TOOL_ROUTES).filter(([, route]) => !registered.has(route));
    expect(missing).toEqual([]);
  });

  it("recognises exactly the advertised names", () => {
    for (const name of toolNames) expect(isToolName(name)).toBe(true);
    expect(isToolName("get_quote; DROP TABLE")).toBe(false);
    expect(isToolName("toString")).toBe(false);
    expect(isToolName("__proto__")).toBe(false);
  });

  it("requires every argument the manifest marks required", () => {
    for (const tool of TOOLS) {
      for (const required of tool.inputSchema.required) {
        expect(
          Object.keys(TOOL_SCHEMAS[tool.name].entries),
          `${tool.name} validates its required argument ${required}`,
        ).toContain(required);
      }
    }
  });
});

describe("MCP argument validation", () => {
  it("rejects a missing symbol instead of requesting /api/quote/undefined", () => {
    expect(() => parseToolArgs("get_quote", {})).toThrow(/symbol/);
  });

  it("rejects a symbol that would escape the URL path", () => {
    expect(() => parseToolArgs("get_quote", { symbol: "../../admin" })).toThrow(/unsupported/);
    expect(() => parseToolArgs("get_quote", { symbol: "AAPL/../x" })).toThrow(/unsupported/);
  });

  it("rejects a non-array indicators argument instead of throwing from join", () => {
    expect(() => parseToolArgs("get_indicators", { symbol: "AAPL", indicators: "rsi" })).toThrow(
      /indicators/,
    );
  });

  it("applies the documented defaults", () => {
    expect(parseToolArgs("get_chart_data", { symbol: "AAPL" })).toEqual({
      symbol: "AAPL",
      range: "3mo",
      interval: "1d",
    });
    expect(parseToolArgs("get_indicators", { symbol: "AAPL", indicators: ["rsi"] }).period).toBe(
      14,
    );
  });

  it("rejects a range outside the advertised enum", () => {
    expect(() => parseToolArgs("get_chart_data", { symbol: "AAPL", range: "99y" })).toThrow();
  });

  it("caps screener tickers at the documented 50", () => {
    const tickers = Array.from({ length: 51 }, (_, i) => `T${i}`);
    expect(() => parseToolArgs("run_screener", { tickers })).toThrow();
    expect(parseToolArgs("run_screener", { tickers: tickers.slice(0, 50) }).tickers).toHaveLength(
      50,
    );
  });

  it("drops arguments the screener does not declare", () => {
    const parsed = parseToolArgs("run_screener", {
      tickers: ["AAPL"],
      minRsi: 30,
      sneaky: "payload",
    });
    expect(parsed).not.toHaveProperty("sneaky");
    expect(parsed.minRsi).toBe(30);
  });

  it("rejects an out-of-range RSI bound", () => {
    expect(() => parseToolArgs("run_screener", { tickers: ["AAPL"], minRsi: 101 })).toThrow();
  });

  it("rejects holdings with negative shares", () => {
    expect(() =>
      parseToolArgs("get_portfolio_analytics", {
        holdings: [{ symbol: "AAPL", shares: -1, costBasis: 10 }],
      }),
    ).toThrow();
  });

  it("rejects an empty holdings list", () => {
    expect(() => parseToolArgs("get_portfolio_analytics", { holdings: [] })).toThrow();
  });
});
