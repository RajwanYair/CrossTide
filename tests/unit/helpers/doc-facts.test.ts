/** Documentation fact gate tests — published counts must come from the repository. */
import { describe, expect, it } from "vitest";
import {
  collectDocumentedFacts,
  validateDocumentFacts,
} from "../../../scripts/check-doc-facts.mjs";

describe("check-doc-facts", () => {
  it("derives current source facts", () => {
    expect(collectDocumentedFacts()).toMatchObject({
      sourceModules: 517,
      domainModules: 220,
      coreModules: 139,
      uiModules: 75,
      cardFiles: 52,
      registeredCards: 25,
    });
  });

  it("accepts the canonical documentation", () => {
    expect(() => validateDocumentFacts()).not.toThrow();
  });
});
