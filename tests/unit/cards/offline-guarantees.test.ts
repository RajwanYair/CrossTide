/** Route-level offline guarantee documentation contract. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listCards } from "../../../src/cards/registry";

describe("offline guarantee documentation", () => {
  it("documents every registered card route", () => {
    const document = readFileSync(resolve(process.cwd(), "docs/OFFLINE-GUARANTEES.md"), "utf8");
    const routeTable = document.slice(document.indexOf("## Route Guarantees"));

    for (const card of listCards()) {
      expect(routeTable).toMatch(new RegExp(`\\| ${card.route} \\|`));
    }
  });
});
