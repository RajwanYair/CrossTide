/** Documentation fact gate tests — published counts must come from the repository. */
import { describe, expect, it } from "vitest";
import {
  collectDocumentedFacts,
  validateDocumentFacts,
} from "../../../scripts/check-doc-facts.mjs";

describe("check-doc-facts", () => {
  it("derives current source facts", () => {
    expect(collectDocumentedFacts()).toMatchObject({
      sourceModules: 523,
      domainModules: 222,
      coreModules: 140,
      uiModules: 76,
      cardFiles: 53,
      registeredCards: 25,
    });
  });

  it("accepts the canonical documentation", () => {
    expect(() => validateDocumentFacts()).not.toThrow();
  });
});
