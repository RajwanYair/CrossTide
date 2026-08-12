/** Workflow policy tests keep CI install and command rules executable. */
import { describe, expect, it } from "vitest";
import {
  validateWorkflowPolicy,
  validateWorkflowSource,
} from "../../../scripts/check-workflow-policy.mjs";

describe("validateWorkflowSource", () => {
  it("ignores npx examples in YAML comments", () => {
    const source = [
      "name: test",
      "on: push",
      "jobs:",
      "  test:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: npm ci --ignore-scripts",
      "      # npx can fetch an unpinned tool",
    ].join("\n");

    expect(validateWorkflowSource(source, ".github/workflows/test.yml")).toEqual([]);
  });

  it("rejects unsafe install and command policies", () => {
    const source = [
      "name: test",
      "on: push",
      "jobs:",
      "  test:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: npm ci",
      "      - run: npx vite build",
    ].join("\n");

    expect(validateWorkflowSource(source, ".github/workflows/test.yml")).toEqual([
      ".github/workflows/test.yml uses npm ci without --ignore-scripts",
      ".github/workflows/test.yml uses npx; invoke declared tools from node_modules/.bin",
    ]);
  });
});

describe("validateWorkflowPolicy", () => {
  it("passes the checked-in workflow set", () => {
    expect(validateWorkflowPolicy()).toEqual([]);
  });
});
