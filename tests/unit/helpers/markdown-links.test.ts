/** Local Markdown link checks — prevent documentation regressions without network calls. */
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { checkDocumentLinks } from "../../../scripts/check-markdown-links.mjs";

describe("checkDocumentLinks", () => {
  it("accepts an existing file and heading anchor", () => {
    const root = resolve(process.cwd(), "virtual-docs");
    const sourceFile = resolve(root, "index.md");
    const documents = new Map([
      [sourceFile, "# Index\n\n[Guide](guide.md#setup)"],
      [resolve(root, "guide.md"), "# Setup"],
    ]);
    const source = documents.get(sourceFile);

    expect(checkDocumentLinks(source, sourceFile, documents)).toEqual([]);
  });

  it("reports missing local targets", () => {
    const sourceFile = resolve(process.cwd(), "virtual-docs/index.md");
    const documents = new Map([[sourceFile, "[Missing](missing.md)"]]);

    expect(checkDocumentLinks("[Missing](missing.md)", sourceFile, documents)[0]).toContain(
      "missing target missing.md",
    );
  });
});
