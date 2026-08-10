/**
 * Reachability inventory tests — keep the stitching metric tied to the source graph.
 */
import { describe, expect, it } from "vitest";
import {
  buildInventory,
  renderDispositionReport,
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

  it("keeps hard orphans visible with an actionable disposition", () => {
    const inventory = buildInventory();
    const watchlistStore = inventory.modules.find(
      (module) => module.path === "src/core/watchlist-store.ts",
    );

    expect(watchlistStore?.category).toBe("HARD_ORPHAN");
    expect(watchlistStore?.disposition).toBe("WIRE");
    expect(watchlistStore?.importers).toEqual([]);
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
});
