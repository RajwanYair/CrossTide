/**
 * Tests for H5 — CSS @scope utility module.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  supportsCssScope,
  buildScopeRule,
  injectScopedStyles,
  removeScopedStyles,
  removeAllScopedStyles,
} from "../../../src/core/css-scope";

// ─── helpers ─────────────────────────────────────────────────────────────────

function cleanupScopeStyles(): void {
  document.querySelectorAll("style[data-ct-scope]").forEach((el) => el.remove());
}

/** Stub CSSStyleSheet.prototype.insertRule to control @scope support. */
function stubInsertRule(shouldThrow: boolean): () => void {
  const orig = CSSStyleSheet.prototype.insertRule;
  CSSStyleSheet.prototype.insertRule = vi.fn((...args) => {
    if (shouldThrow) throw new DOMException("Not supported");
    return orig.call(new CSSStyleSheet(), ...args);
  });
  return () => {
    CSSStyleSheet.prototype.insertRule = orig;
  };
}

// ─── supportsCssScope ────────────────────────────────────────────────────────

describe("supportsCssScope", () => {
  afterEach(() => {
    cleanupScopeStyles();
  });

  it("returns false when CSSStyleSheet.insertRule throws for @scope", () => {
    const restore = stubInsertRule(true);
    expect(supportsCssScope()).toBe(false);
    restore();
  });

  it("returns true when CSSStyleSheet.insertRule succeeds", () => {
    const restore = stubInsertRule(false);
    expect(supportsCssScope()).toBe(true);
    restore();
  });

  it("returns false when CSS global is absent", () => {
    const orig = globalThis.CSS;
    Reflect.deleteProperty(globalThis, "CSS");
    expect(supportsCssScope()).toBe(false);
    globalThis.CSS = orig;
  });
});

// ─── buildScopeRule ───────────────────────────────────────────────────────────

describe("buildScopeRule", () => {
  it("wraps CSS in @scope selector block", () => {
    const result = buildScopeRule(".card", "h2 { font-size: 1rem; }");
    expect(result).toContain("@scope (.card)");
    expect(result).toContain("h2 { font-size: 1rem; }");
  });

  it("produces parseable @scope syntax", () => {
    const result = buildScopeRule(".widget", ".title { color: red; }");
    expect(result).toMatch(/^@scope \(\.widget\) \{/);
    expect(result).toMatch(/\}$/);
  });

  it("handles compound selectors", () => {
    const result = buildScopeRule(".card.featured", "p { margin: 0; }");
    expect(result).toContain("@scope (.card.featured)");
  });
});

// ─── injectScopedStyles ───────────────────────────────────────────────────────

describe("injectScopedStyles (scope supported)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubInsertRule(false);
  });
  afterEach(() => {
    restore();
    cleanupScopeStyles();
  });

  it("returns a style element", () => {
    const el = injectScopedStyles(".x", "p { color: red; }");
    expect(el).toBeInstanceOf(HTMLStyleElement);
  });

  it("appends to document.head", () => {
    const el = injectScopedStyles(".x", "p { color: red; }");
    expect(document.head.contains(el)).toBe(true);
  });

  it("wraps content in @scope rule", () => {
    const el = injectScopedStyles(".card", "h2 { margin: 0; }");
    expect(el.textContent).toContain("@scope (.card)");
    expect(el.textContent).toContain("h2 { margin: 0; }");
  });

  it("uses provided id attribute", () => {
    const el = injectScopedStyles(".x", "a { color: blue; }", "my-scope");
    expect(el.getAttribute("data-ct-scope")).toBe("my-scope");
  });

  it("auto-generates id when none provided", () => {
    const el = injectScopedStyles(".x", "b { font-weight: bold; }");
    expect(el.getAttribute("data-ct-scope")).toMatch(/^ct-scope-\d+$/);
  });
});

describe("injectScopedStyles (scope NOT supported)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubInsertRule(true);
  });
  afterEach(() => {
    restore();
    cleanupScopeStyles();
  });

  it("injects CSS verbatim without @scope wrapper", () => {
    const css = ".x { color: green; }";
    const el = injectScopedStyles(".x", css);
    expect(el.textContent).toBe(css);
    expect(el.textContent).not.toContain("@scope");
  });
});

// ─── removeScopedStyles ───────────────────────────────────────────────────────

describe("removeScopedStyles", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubInsertRule(false);
  });
  afterEach(() => {
    restore();
    cleanupScopeStyles();
  });

  it("removes the element with the given id", () => {
    injectScopedStyles(".a", "p {}", "to-remove");
    injectScopedStyles(".b", "p {}", "to-keep");
    removeScopedStyles("to-remove");
    expect(document.querySelector('[data-ct-scope="to-remove"]')).toBeNull();
    expect(document.querySelector('[data-ct-scope="to-keep"]')).not.toBeNull();
  });

  it("is a no-op when id does not exist", () => {
    const before = document.querySelectorAll("[data-ct-scope]").length;
    removeScopedStyles("nonexistent");
    expect(document.querySelectorAll("[data-ct-scope]").length).toBe(before);
  });
});

// ─── removeAllScopedStyles ────────────────────────────────────────────────────

describe("removeAllScopedStyles", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubInsertRule(false);
  });
  afterEach(() => {
    restore();
    cleanupScopeStyles();
  });

  it("removes all injected style elements", () => {
    injectScopedStyles(".a", "p {}");
    injectScopedStyles(".b", "div {}");
    injectScopedStyles(".c", "span {}");
    removeAllScopedStyles();
    expect(document.querySelectorAll("[data-ct-scope]")).toHaveLength(0);
  });

  it("is a no-op when none exist", () => {
    expect(() => removeAllScopedStyles()).not.toThrow();
  });
});
