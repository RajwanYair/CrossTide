/**
 * Regression guard for the publishable domain import boundary.
 *
 * @module tests/unit/domain/domain-purity
 */

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";

const CHECKER = "scripts/check-domain-purity.mjs";

describe("domain purity contract", () => {
  it("passes the repository domain purity checker", () => {
    const result = spawnSync(process.execPath, [CHECKER], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toMatch(/Domain purity check passed:/u);
  });
});
