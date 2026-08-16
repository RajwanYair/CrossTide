/**
 * MCP server health probe (roadmap P06) — the one health-probe surface
 * ("MCP journeys") smoke.yml cannot cover, since the MCP server is a local
 * stdio process with no production HTTP endpoint. This is the only check in
 * the repository that exercises `mcp-server/src/index.ts`'s actual server
 * wiring (tool registration, request handlers) end to end — everything else
 * about that file is untestable by unit tests because it calls `main()`
 * unconditionally at module load (see `mcp-server/src/api-client.ts` for the
 * part that was extracted specifically to be unit-testable).
 *
 * Spawns the built server, lists its tools over the real MCP stdio
 * transport, and asserts the advertised tool set matches the manifest.
 * Requires `npm run build --workspace mcp-server` to have run first.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SERVER_ENTRY = resolve(ROOT, "mcp-server/dist/index.js");

const EXPECTED_TOOLS = [
  "get_quote",
  "get_consensus",
  "get_chart_data",
  "get_indicators",
  "run_screener",
  "get_portfolio_analytics",
];

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_ENTRY],
  });
  const client = new Client({ name: "crosstide-mcp-health-check", version: "1.0.0" });

  await client.connect(transport);

  try {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    const expected = [...EXPECTED_TOOLS].sort();

    const missing = expected.filter((name) => !names.includes(name));
    const unexpected = names.filter((name) => !expected.includes(name));

    if (missing.length > 0 || unexpected.length > 0) {
      throw new Error(
        `Tool set mismatch — missing: [${missing.join(", ")}], unexpected: [${unexpected.join(", ")}]`,
      );
    }

    process.stdout.write(`MCP server health check passed: ${names.length} tools advertised.\n`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  process.stderr.write(`MCP server health check failed: ${error.message}\n`);
  process.exitCode = 1;
});
