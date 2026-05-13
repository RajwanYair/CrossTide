import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  hasConsent,
  grantConsent,
  revokeConsent,
  revokeAllConsent,
  getDisclaimer,
  getAcknowledgedFeatures,
  requireConsent,
  createAiBadge,
  wrapWithDisclaimer,
  DEFAULT_DISCLAIMERS,
  _resetForTesting,
} from "../../../src/core/ai-disclaimer.js";
import type { AiFeatureId } from "../../../src/core/ai-disclaimer.js";

// Ensure localStorage is available (happy-dom should provide it)
function clearStorage(): void {
  try {
    localStorage.clear();
  } catch {
    // If localStorage is unavailable, mock it
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k in store) delete store[k];
      },
    });
  }
}

describe("ai-disclaimer", () => {
  beforeEach(() => {
    clearStorage();
    _resetForTesting();
  });

  describe("consent management", () => {
    it("should default to no consent", () => {
      expect(hasConsent("webllm")).toBe(false);
      expect(getAcknowledgedFeatures()).toEqual([]);
    });

    it("should grant and persist consent", () => {
      grantConsent("webllm");
      expect(hasConsent("webllm")).toBe(true);
      expect(hasConsent("nlp-sentiment")).toBe(false);
      expect(getAcknowledgedFeatures()).toEqual(["webllm"]);
    });

    it("should revoke consent for a single feature", () => {
      grantConsent("webllm");
      grantConsent("nlp-sentiment");
      revokeConsent("webllm");
      expect(hasConsent("webllm")).toBe(false);
      expect(hasConsent("nlp-sentiment")).toBe(true);
    });

    it("should revoke all consent", () => {
      grantConsent("webllm");
      grantConsent("nlp-sentiment");
      revokeAllConsent();
      expect(hasConsent("webllm")).toBe(false);
      expect(hasConsent("nlp-sentiment")).toBe(false);
      expect(getAcknowledgedFeatures()).toEqual([]);
    });

    it("should survive reload (localStorage)", () => {
      grantConsent("pattern-recognition");
      _resetForTesting(); // simulate page reload
      expect(hasConsent("pattern-recognition")).toBe(true);
    });

    it("should handle corrupted localStorage gracefully", () => {
      try {
        localStorage.setItem("ct-ai-consent", "not-json");
      } catch {
        return; // skip if localStorage unavailable
      }
      _resetForTesting();
      expect(hasConsent("webllm")).toBe(false); // fallback to empty state
    });
  });

  describe("getDisclaimer", () => {
    it("should return config for known features", () => {
      const d = getDisclaimer("webllm");
      expect(d.feature).toBe("webllm");
      expect(d.badge).toBe("AI-generated");
      expect(d.requiresOptIn).toBe(true);
      expect(d.disclaimer).toContain("NOT constitute financial");
    });

    it("should throw for unknown features", () => {
      expect(() => getDisclaimer("unknown" as AiFeatureId)).toThrow("Unknown AI feature");
    });

    it("should have disclaimers for all 7 features", () => {
      expect(DEFAULT_DISCLAIMERS).toHaveLength(7);
      const ids = DEFAULT_DISCLAIMERS.map((d) => d.feature);
      expect(ids).toContain("webllm");
      expect(ids).toContain("nlp-sentiment");
      expect(ids).toContain("pattern-recognition");
      expect(ids).toContain("anomaly-detection");
      expect(ids).toContain("screener-dsl-translate");
      expect(ids).toContain("signal-dsl-translate");
      expect(ids).toContain("chart-explanation");
    });
  });

  describe("requireConsent", () => {
    it("should return false when no consent given", () => {
      expect(requireConsent("webllm")).toBe(false);
    });

    it("should return true after consent granted", () => {
      grantConsent("webllm");
      expect(requireConsent("webllm")).toBe(true);
    });
  });

  describe("DOM helpers", () => {
    it("should create a badge element", () => {
      const badge = createAiBadge("nlp-sentiment");
      expect(badge.tagName).toBe("SPAN");
      expect(badge.className).toBe("ct-ai-badge");
      expect(badge.textContent).toContain("AI sentiment");
      expect(badge.getAttribute("role")).toBe("status");
      expect(badge.getAttribute("aria-label")).toContain("not financial advice");
    });

    it("should wrap content with disclaimer", () => {
      const content = document.createElement("p");
      content.textContent = "Test output";
      const wrapped = wrapWithDisclaimer(content, "chart-explanation");
      expect(wrapped.className).toBe("ct-ai-content");
      expect(wrapped.getAttribute("data-ai-feature")).toBe("chart-explanation");
      expect(wrapped.getAttribute("role")).toBe("region");
      expect(wrapped.querySelector(".ct-ai-badge")).toBeTruthy();
      expect(wrapped.querySelector("p")?.textContent).toBe("Test output");
    });
  });
});
