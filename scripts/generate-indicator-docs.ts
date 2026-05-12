/**
 * Auto-generate indicator documentation from JSDoc comments (R5).
 *
 * Scans all src/domain/*.ts files, extracts:
 *  - Module name and description from the file-level JSDoc block
 *  - Exported function names and their descriptions
 *  - Key interfaces (input/output types)
 *
 * Outputs a markdown table + per-indicator detail sections to docs/INDICATORS.md.
 *
 * Usage:
 *   npx tsx scripts/generate-indicator-docs.ts
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, basename } from "node:path";

const DOMAIN_DIR = resolve(import.meta.dirname ?? __dirname, "../src/domain");
const OUTPUT = resolve(import.meta.dirname ?? __dirname, "../docs/INDICATORS.md");

// Files that are not indicators (infrastructure, utilities, types)
const EXCLUDE = new Set(["index.ts", "branded.ts", "technical-defaults.ts", "types.ts"]);

interface IndicatorInfo {
  filename: string;
  moduleName: string;
  description: string;
  functions: FunctionInfo[];
  interfaces: string[];
  category: string;
}

interface FunctionInfo {
  name: string;
  description: string;
}

// ── Category classification ───────────────────────────────────────────────────

function classifyCategory(filename: string, description: string): string {
  const name = filename.toLowerCase();
  const desc = description.toLowerCase();

  if (name.includes("method") || name.includes("consensus")) return "Signal Methods";
  if (name.includes("backtest") || name.includes("commission") || name.includes("position-siz"))
    return "Backtesting";
  if (name.includes("pattern") || name.includes("candlestick") || name.includes("breakout"))
    return "Pattern Recognition";
  if (name.includes("portfolio") || name.includes("rebalance") || name.includes("risk"))
    return "Portfolio & Risk";
  if (name.includes("chart") || name.includes("kagi") || name.includes("point-and-figure"))
    return "Chart Types";
  if (name.includes("alert") || name.includes("notification")) return "Alerts";
  if (name.includes("dsl") || name.includes("signal-dsl")) return "Signal DSL";
  if (name.includes("correlation") || name.includes("copula") || name.includes("cointegration"))
    return "Statistical Analysis";
  if (desc.includes("oscillator") || desc.includes("momentum")) return "Oscillators & Momentum";
  if (desc.includes("trend") || desc.includes("moving average")) return "Trend Indicators";
  if (desc.includes("volume") || desc.includes("money flow")) return "Volume Indicators";
  if (desc.includes("volatility") || desc.includes("atr") || desc.includes("bollinger"))
    return "Volatility Indicators";
  return "Other";
}

// ── JSDoc extraction ──────────────────────────────────────────────────────────

function extractFileJsdoc(source: string): string {
  const match = source.match(/^\/\*\*([\s\S]*?)\*\//);
  if (!match?.[1]) return "";
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter((line) => !line.startsWith("@"))
    .join(" ")
    .trim();
}

function extractExportedFunctions(source: string): FunctionInfo[] {
  const results: FunctionInfo[] = [];
  const regex = /\/\*\*([\s\S]*?)\*\/\s*\nexport\s+(?:async\s+)?function\s+(\w+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    const jsdocBlock = match[1] ?? "";
    const name = match[2] ?? "";
    const description = jsdocBlock
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, "").trim())
      .filter((line) => line && !line.startsWith("@"))
      .join(" ")
      .trim();
    results.push({ name, description: description || "—" });
  }

  // Also catch functions without preceding JSDoc
  const exportRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  while ((match = exportRegex.exec(source)) !== null) {
    const name = match[1] ?? "";
    if (!results.some((f) => f.name === name)) {
      results.push({ name, description: "—" });
    }
  }

  return results;
}

function extractExportedInterfaces(source: string): string[] {
  const regex = /export\s+interface\s+(\w+)/g;
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const name = match[1];
    if (name) results.push(name);
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  const files = readdirSync(DOMAIN_DIR)
    .filter((f) => f.endsWith(".ts") && !EXCLUDE.has(f))
    .sort();

  const indicators: IndicatorInfo[] = [];

  for (const file of files) {
    const source = readFileSync(resolve(DOMAIN_DIR, file), "utf-8");
    const description = extractFileJsdoc(source);
    const functions = extractExportedFunctions(source);
    const interfaces = extractExportedInterfaces(source);

    // Skip files with no exports (pure type files, etc.)
    if (functions.length === 0 && interfaces.length === 0) continue;

    const moduleName = basename(file, ".ts")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    indicators.push({
      filename: file,
      moduleName,
      description: description || "—",
      functions,
      interfaces,
      category: classifyCategory(file, description),
    });
  }

  // Group by category
  const categories = new Map<string, IndicatorInfo[]>();
  for (const ind of indicators) {
    const list = categories.get(ind.category) ?? [];
    list.push(ind);
    categories.set(ind.category, list);
  }

  // Generate markdown
  const lines: string[] = [
    "# CrossTide Indicator Reference",
    "",
    `> Auto-generated from \`src/domain/\` JSDoc on ${new Date().toISOString().slice(0, 10)}.`,
    `> ${indicators.length} modules | ${indicators.reduce((sum, i) => sum + i.functions.length, 0)} exported functions | ${indicators.reduce((sum, i) => sum + i.interfaces.length, 0)} interfaces`,
    "",
    "## Summary Table",
    "",
    "| Module | Category | Functions | Description |",
    "| --- | --- | --- | --- |",
  ];

  for (const ind of indicators) {
    const desc = ind.description.length > 80 ? ind.description.slice(0, 77) + "…" : ind.description;
    lines.push(
      `| [\`${ind.moduleName}\`](#${ind.moduleName.toLowerCase().replace(/ /g, "-")}) | ${ind.category} | ${ind.functions.length} | ${desc} |`,
    );
  }

  lines.push("", "---", "");

  // Per-category detailed sections
  const sortedCategories = [...categories.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [category, inds] of sortedCategories) {
    lines.push(`## ${category}`, "");

    for (const ind of inds) {
      lines.push(`### ${ind.moduleName}`, "");
      lines.push(`**File:** \`src/domain/${ind.filename}\``, "");
      if (ind.description !== "—") {
        lines.push(ind.description, "");
      }

      if (ind.functions.length > 0) {
        lines.push("**Functions:**", "");
        lines.push("| Function | Description |");
        lines.push("| --- | --- |");
        for (const fn of ind.functions) {
          lines.push(`| \`${fn.name}()\` | ${fn.description} |`);
        }
        lines.push("");
      }

      if (ind.interfaces.length > 0) {
        lines.push(`**Types:** ${ind.interfaces.map((i) => `\`${i}\``).join(", ")}`, "");
      }

      lines.push("---", "");
    }
  }

  writeFileSync(OUTPUT, lines.join("\n"));
  console.log(`✅ Generated ${OUTPUT}`);
  console.log(
    `   ${indicators.length} modules, ${indicators.reduce((s, i) => s + i.functions.length, 0)} functions documented`,
  );
}

main();
