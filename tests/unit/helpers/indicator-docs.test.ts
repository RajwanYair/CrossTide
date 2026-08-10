/** Indicator documentation generator tests — keep generated Markdown stable and valid. */
import { describe, expect, it } from "vitest";
import {
  escapeTableCell,
  extractExportedFunctions,
  extractFileJsdoc,
} from "../../../scripts/generate-indicator-docs.ts";

describe("indicator documentation generator", () => {
  it("keeps only the first paragraph of a file JSDoc block", () => {
    expect(
      extractFileJsdoc(
        `/** First sentence.\n *\n * Implementation details.\n * @module example\n */`,
      ),
    ).toBe("First sentence.");
  });

  it("does not include the closing JSDoc delimiter", () => {
    expect(extractFileJsdoc("/** Summary.\n */")).toBe("Summary.");
  });

  it("extracts concise function summaries", () => {
    const source = [
      "/** Compute the value.",
      " *",
      " * More implementation detail.",
      " */",
      "export function compute(): number { return 1; }",
    ].join("\n");

    expect(extractExportedFunctions(source)).toEqual([
      { name: "compute", description: "Compute the value." },
    ]);
  });

  it("escapes Markdown table delimiters and line breaks", () => {
    expect(escapeTableCell("A | B\nC")).toBe("A \\| B C");
  });
});
