/**
 * Guard: every module under `src/domain/` must be reachable from the public
 * barrel (`src/domain/index.ts`).
 *
 * 51 tested domain modules — 23% of the layer — were unreachable from the
 * barrel and imported by no card, so they were dead at runtime and absent from
 * the surface that roadmap E20 will publish as `@crosstide/domain`. This test
 * fails if a new module is added without a barrel entry.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const DOMAIN_DIR = resolve(process.cwd(), "src/domain");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (entry.name.endsWith(".ts")) out.push(path.replaceAll("\\", "/"));
  }
  return out;
}

const barrel = readFileSync(join(DOMAIN_DIR, "index.ts"), "utf8");
const modules = walk(DOMAIN_DIR).filter((f) => !f.endsWith("/index.ts"));

/** Specifiers the barrel re-exports from, e.g. `./rsi` or `./indicators/adx`. */
const reExported = new Set(
  [...barrel.matchAll(/from\s+"\.\/([^"]+)"/g)].map((m) => basename(m[1] ?? "")),
);

describe("domain barrel completeness", () => {
  it("finds the domain layer", () => {
    expect(modules.length).toBeGreaterThan(200);
  });

  it("re-exports every domain module", () => {
    const missing = modules
      .map((f) => basename(f, ".ts"))
      .filter((name) => !reExported.has(name))
      .sort();

    expect(missing, `add these to src/domain/index.ts: ${missing.join(", ")}`).toEqual([]);
  });

  it("re-exports only modules that exist", () => {
    const names = new Set(modules.map((f) => basename(f, ".ts")));
    const dangling = [...reExported].filter((name) => !names.has(name)).sort();

    expect(dangling, `stale barrel entries: ${dangling.join(", ")}`).toEqual([]);
  });
});
