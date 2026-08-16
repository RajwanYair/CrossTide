/**
 * Tests for H3 — Speculation Rules API module.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  speculationRulesSupported,
  injectSpeculationRules,
  removeSpeculationRules,
  buildPrefetchRules,
  buildPrerenderRules,
  linkPrefetchFallback,
} from "../../../src/core/speculation-rules";

// ─── helpers ─────────────────────────────────────────────────────────────────

function cleanupSpeculationScripts(): void {
  document.querySelectorAll("script[data-ct-speculation]").forEach((el) => el.remove());
}

function cleanupPrefetchLinks(): void {
  document.querySelectorAll('link[rel="prefetch"]').forEach((el) => el.remove());
}

function stubSupports(supported: boolean): () => void {
  const orig = (HTMLScriptElement as unknown as Record<string, unknown>).supports;
  (HTMLScriptElement as unknown as Record<string, unknown>).supports = vi.fn(() => supported);
  return () => {
    if (orig !== undefined) {
      (HTMLScriptElement as unknown as Record<string, unknown>).supports = orig;
    } else {
      delete (HTMLScriptElement as unknown as Record<string, unknown>).supports;
    }
  };
}

// ─── speculationRulesSupported ────────────────────────────────────────────────

describe("speculationRulesSupported", () => {
  it("returns false when HTMLScriptElement.supports is absent", () => {
    const restore = stubSupports(false);
    // override to make supports return false
    expect(speculationRulesSupported()).toBe(false);
    restore();
  });

  it("returns true when HTMLScriptElement.supports('speculationrules') returns true", () => {
    const restore = stubSupports(true);
    expect(speculationRulesSupported()).toBe(true);
    restore();
  });
});

// ─── buildPrefetchRules ───────────────────────────────────────────────────────

describe("buildPrefetchRules", () => {
  it("builds a prefetch rule with default eagerness", () => {
    const rules = buildPrefetchRules(["/a", "/b"]);
    expect(rules.prefetch).toHaveLength(1);
    expect(rules.prefetch![0].urls).toEqual(["/a", "/b"]);
    expect(rules.prefetch![0].eagerness).toBe("moderate");
  });

  it("accepts custom eagerness", () => {
    const rules = buildPrefetchRules(["/c"], "immediate");
    expect(rules.prefetch![0].eagerness).toBe("immediate");
  });

  it("returns no prerender key", () => {
    const rules = buildPrefetchRules(["/x"]);
    expect(rules.prerender).toBeUndefined();
  });
});

// ─── buildPrerenderRules ──────────────────────────────────────────────────────

describe("buildPrerenderRules", () => {
  it("builds a prerender rule with default eagerness", () => {
    const rules = buildPrerenderRules(["/page1"]);
    expect(rules.prerender).toHaveLength(1);
    expect(rules.prerender![0].urls).toEqual(["/page1"]);
    expect(rules.prerender![0].eagerness).toBe("conservative");
  });

  it("returns no prefetch key", () => {
    const rules = buildPrerenderRules(["/p"]);
    expect(rules.prefetch).toBeUndefined();
  });
});

// ─── injectSpeculationRules ───────────────────────────────────────────────────

describe("injectSpeculationRules (supported)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubSupports(true);
  });
  afterEach(() => {
    restore();
    cleanupSpeculationScripts();
    vi.restoreAllMocks();
  });

  it("returns a script element", () => {
    const el = injectSpeculationRules({ prefetch: [{ urls: ["/a"] }] });
    expect(el).toBeInstanceOf(HTMLScriptElement);
  });

  it("script has type speculationrules", () => {
    const el = injectSpeculationRules({ prefetch: [{ urls: ["/a"] }] });
    expect(el!.type).toBe("speculationrules");
  });

  it("script src is a blob: URL", () => {
    const el = injectSpeculationRules({ prefetch: [{ urls: ["/a"] }] });
    expect(el!.src).toMatch(/^blob:/);
  });

  it("uses the provided id attribute", () => {
    const el = injectSpeculationRules({ prefetch: [] }, "my-id");
    expect(el!.getAttribute("data-ct-speculation")).toBe("my-id");
  });

  it("auto-generates an id when none is provided", () => {
    const el = injectSpeculationRules({ prerender: [] });
    expect(el!.getAttribute("data-ct-speculation")).toMatch(/^ct-sr-\d+$/);
  });

  it("appends to document.head", () => {
    const el = injectSpeculationRules({ prefetch: [] });
    expect(document.head.contains(el!)).toBe(true);
  });
});

describe("injectSpeculationRules (unsupported)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubSupports(false);
  });
  afterEach(() => {
    restore();
  });

  it("returns null when unsupported", () => {
    const result = injectSpeculationRules({ prefetch: [] });
    expect(result).toBeNull();
  });
});

// ─── removeSpeculationRules ───────────────────────────────────────────────────

describe("removeSpeculationRules", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubSupports(true);
  });
  afterEach(() => {
    restore();
    cleanupSpeculationScripts();
  });

  it("removes a specific id", () => {
    injectSpeculationRules({ prefetch: [] }, "remove-me");
    injectSpeculationRules({ prefetch: [] }, "keep-me");
    removeSpeculationRules("remove-me");
    expect(document.querySelector('[data-ct-speculation="remove-me"]')).toBeNull();
    expect(document.querySelector('[data-ct-speculation="keep-me"]')).not.toBeNull();
  });

  it("removes all when no id provided", () => {
    injectSpeculationRules({ prefetch: [] });
    injectSpeculationRules({ prefetch: [] });
    removeSpeculationRules();
    expect(document.querySelectorAll("[data-ct-speculation]")).toHaveLength(0);
  });
});

// ─── linkPrefetchFallback ─────────────────────────────────────────────────────

describe("linkPrefetchFallback", () => {
  afterEach(() => {
    cleanupPrefetchLinks();
  });

  it("returns an array of link elements", () => {
    const links = linkPrefetchFallback(["/a", "/b"]);
    expect(links).toHaveLength(2);
    expect(links[0]).toBeInstanceOf(HTMLLinkElement);
  });

  it("each link has rel=prefetch", () => {
    const links = linkPrefetchFallback(["/c"]);
    expect(links[0].rel).toBe("prefetch");
  });

  it("each link has the correct href", () => {
    const links = linkPrefetchFallback(["/page1", "/page2"]);
    expect(links[0].href).toContain("/page1");
    expect(links[1].href).toContain("/page2");
  });

  it("appends links to document.head", () => {
    const links = linkPrefetchFallback(["/x"]);
    expect(document.head.contains(links[0])).toBe(true);
  });
});
