/**
 * Guard: the OpenAPI document must describe the routes the Worker actually
 * registers.
 *
 * `worker/routes/openapi.ts` is hand-maintained, and `scripts/gen-openapi-client.mjs`
 * derives `src/core/api-types.ts` from it — so a route missing from the spec is
 * a route missing from the generated client, and the only thing that caught it
 * was a manual checkbox in the pre-release checklist.
 *
 * The gap tracked under https://github.com/RajwanYair/CrossTide/issues/105 has
 * been closed — every registered route is documented. `KNOWN_GAP` stays as an
 * empty ratchet: it may only shrink, so a newly registered undocumented route
 * fails immediately instead of silently reopening the gap.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { OPENAPI_SPEC } from "../../../worker/routes/openapi";

const WORKER_INDEX = readFileSync(resolve(process.cwd(), "worker/index.ts"), "utf8");

/** `app.get("/api/quote/:symbol", …)` → `GET /api/quote/{symbol}`. */
function registeredRoutes(): string[] {
  const found = new Set<string>();
  for (const m of WORKER_INDEX.matchAll(/^app\.(get|post|put|delete|patch)\("([^"]+)"/gm)) {
    const method = (m[1] ?? "").toUpperCase();
    const path = (m[2] ?? "").replace(/:([A-Za-z0-9_]+)/g, "{$1}");
    found.add(`${method} ${path}`);
  }
  return [...found].sort();
}

function documentedRoutes(): string[] {
  const found: string[] = [];
  for (const [path, ops] of Object.entries(OPENAPI_SPEC.paths)) {
    for (const method of Object.keys(ops as Record<string, unknown>)) {
      found.push(`${method.toUpperCase()} ${path}`);
    }
  }
  return found.sort();
}

/**
 * Routes registered on the Worker that the spec does not yet describe.
 * Empty — closed under #105. This list may only get shorter.
 */
const KNOWN_GAP: readonly string[] = [];

describe("OpenAPI contract", () => {
  const registered = registeredRoutes();
  const documented = documentedRoutes();

  it("finds the Worker route table", () => {
    expect(registered.length).toBeGreaterThan(50);
  });

  it("documents no route the Worker does not register", () => {
    // `/openapi.json` is served outside the `app.get("…")` block this parses.
    const phantom = documented.filter((r) => r !== "GET /openapi.json" && !registered.includes(r));
    expect(phantom, `spec describes unregistered routes: ${phantom.join(", ")}`).toEqual([]);
  });

  it("registers no undocumented route outside the known gap", () => {
    const undocumented = registered.filter((r) => !documented.includes(r));
    const unexpected = undocumented.filter((r) => !KNOWN_GAP.includes(r));

    expect(
      unexpected,
      `new routes must be added to worker/routes/openapi.ts: ${unexpected.join(", ")}`,
    ).toEqual([]);
  });

  it("keeps the known gap honest — it may only shrink", () => {
    const stale = KNOWN_GAP.filter((r) => documented.includes(r) || !registered.includes(r));

    expect(
      stale,
      `remove these from KNOWN_GAP — they are documented or no longer registered: ${stale.join(", ")}`,
    ).toEqual([]);
  });
});
