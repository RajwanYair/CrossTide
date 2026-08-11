/**
 * Reachability inventory tests - keep stitching metrics tied to the source graph.
 */
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildInventory,
  calculateReachableCoverage,
  renderDispositionReport,
  validateReachabilityGate,
  validateReachableCoverage,
} from "../../../scripts/reachability-inventory.mjs";

describe("buildInventory", () => {
  it("walks both application entry points", () => {
    const inventory = buildInventory();

    expect(inventory.entryPoints).toEqual(["src/main.ts", "src/sw.ts"]);
    expect(inventory.totals.sourceModules).toBeGreaterThan(500);
    expect(inventory.totals.reachable).toBeGreaterThan(0);
    expect(inventory.totals.unreachable).toBeGreaterThan(0);
    expect(inventory.modules.find((module) => module.path === "src/main.ts")?.reachable).toBe(true);
  });

  it("tracks the watchlist store as reachable application state", () => {
    const inventory = buildInventory();
    const watchlistStore = inventory.modules.find(
      (module) => module.path === "src/core/watchlist-store.ts",
    );

    expect(watchlistStore?.category).toBe("REACHABLE");
    expect(watchlistStore?.reachable).toBe(true);
  });

  it("classifies domain modules as publishable instead of deleting them", () => {
    const inventory = buildInventory();
    const domainModules = inventory.modules.filter((module) =>
      module.path.startsWith("src/domain/"),
    );

    expect(domainModules.length).toBeGreaterThan(200);
    expect(domainModules.every((module) => module.disposition === "PUBLISH")).toBe(true);
  });

  it("renders one explicit disposition row for every unreachable module", () => {
    const inventory = buildInventory();
    const report = renderDispositionReport(inventory);
    const rows = report.split("\n").filter((line) => line.startsWith("| `"));

    expect(rows).toHaveLength(inventory.totals.unreachable);
    expect(rows.every((row) => /\| (WIRE|PUBLISH|PROMOTE|MERGE|DEFER) \|$/u.test(row))).toBe(true);
  });

  it("fails when hard-orphan debt grows beyond the ratchet", () => {
    const inventory = buildInventory();

    expect(validateReachabilityGate(inventory)).toEqual([]);
    expect(
      validateReachabilityGate({
        ...inventory,
        totals: { ...inventory.totals, hardOrphans: 45 },
      }),
    ).toEqual(["hard orphans 45 > 44 baseline"]);
  });

  it("aggregates coverage over reachable modules and reports unmeasured modules", () => {
    const inventory = {
      modules: [
        { path: "src/core/reachable.ts", reachable: true },
        { path: "src/ui/unmeasured.ts", reachable: true },
        { path: "src/domain/orphan.ts", reachable: false },
      ],
    };
    const coverage = {
      [resolve("src/core/reachable.ts")]: {
        lines: { covered: 8, total: 10 },
        statements: { covered: 8, total: 10 },
        functions: { covered: 4, total: 5 },
        branches: { covered: 6, total: 8 },
      },
    };

    const result = calculateReachableCoverage(inventory, coverage);

    expect(result.reachableModules).toBe(2);
    expect(result.measuredModules).toBe(1);
    expect(result.unmeasuredModules).toBe(1);
    expect(result.totals.statements.pct).toBe(80);
    expect(validateReachableCoverage(result)).toEqual([
      "statements 80.00% < 89.8% baseline",
      "branches 75.00% < 80.1% baseline",
      "functions 80.00% < 91.4% baseline",
      "lines 80.00% < 91.6% baseline",
    ]);
    expect(validateReachableCoverage({ ...result, unmeasuredModules: 39 })).toContain(
      "unmeasured modules 39 > 38 baseline",
    );
  });
});
