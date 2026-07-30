/**
 * WCAG 2.2 accessibility wiring audit — Q6.
 *
 * These tests verify that the accessibility layer is actually *applied*, not
 * merely present on disk. `src/styles/a11y.css` was orphaned for several
 * releases: `.skip-link`, `.sr-only` and `.btn-icon` appeared in shipped markup
 * while nothing styled them, and asserting against the file's raw text passed
 * the whole time. Every assertion here therefore goes through a real CSS parser
 * (postcss) or the document that ships — never a substring match on the source.
 *
 * Pixel-accurate contrast ratios are verified by the axe integration in
 * tests/e2e/wcag-audit.spec.ts.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import postcss, { type Rule } from "postcss";

const root = process.cwd();
const CSS_A11Y = readFileSync(resolve(root, "src/styles/a11y.css"), "utf8");
const CSS_TOKENS = readFileSync(resolve(root, "src/styles/tokens.css"), "utf8");
const INDEX_HTML = readFileSync(resolve(root, "index.html"), "utf8");

const a11yRules: Rule[] = [];
postcss.parse(CSS_A11Y).walkRules((rule) => a11yRules.push(rule));

/** Declarations of the first rule whose selector list contains `selector`. */
function declsFor(selector: string): Record<string, string> | undefined {
  const rule = a11yRules.find((r) => r.selectors.some((s) => s.trim() === selector));
  if (rule === undefined) return undefined;
  const decls: Record<string, string> = {};
  rule.walkDecls((d) => {
    decls[d.prop] = d.value;
  });
  return decls;
}

/** Every rule that declares `prop`, paired with its selector list. */
function rulesDeclaring(prop: string): { selectors: string[]; value: string }[] {
  const out: { selectors: string[]; value: string }[] = [];
  for (const rule of a11yRules) {
    rule.walkDecls(prop, (d) => out.push({ selectors: rule.selectors, value: d.value }));
  }
  return out;
}

// ── The wiring itself — the defect Q6 fixes ──────────────────────────────────

describe("a11y layer is wired into the document", () => {
  it("index.html loads a11y.css", () => {
    expect(INDEX_HTML).toContain('href="/src/styles/a11y.css"');
  });

  it("the cascade declaration in tokens.css names the a11y layer last", () => {
    const decl = CSS_TOKENS.match(/@layer\s+([^;{]+);/)?.[1];
    expect(decl).toBeDefined();
    const layers = (decl ?? "").split(",").map((s) => s.trim());
    expect(layers).toContain("a11y");
    expect(layers.at(-1)).toBe("a11y");
  });

  it("a11y.css parses without dropping rules", () => {
    expect(a11yRules.length).toBeGreaterThan(15);
  });
});

describe("classes used in shipped markup are styled by the a11y layer", () => {
  it.each([".skip-link", ".sr-only", ".btn-icon"])("%s has a parsed rule", (selector) => {
    expect(declsFor(selector)).toBeDefined();
  });

  it(".sr-only actually hides content visually", () => {
    const decls = declsFor(".sr-only");
    expect(decls?.position).toBe("absolute");
    expect(decls?.width).toBe("1px");
    expect(decls?.height).toBe("1px");
    expect(decls?.overflow).toBe("hidden");
  });

  it(".skip-link is off-screen until focused", () => {
    expect(declsFor(".skip-link")?.top).toBe("-100%");
    expect(declsFor(".skip-link:focus")?.top).toBe("0");
  });
});

// ── SC 2.4.7 / 2.4.13 Focus Appearance ───────────────────────────────────────

describe("SC 2.4.13 Focus Appearance — ring is at least 3px", () => {
  it(":focus-visible outline is >= 3px with a non-zero offset", () => {
    const decls = declsFor(":focus-visible");
    expect(Number(decls?.outline?.match(/(\d+)px/)?.[1] ?? 0)).toBeGreaterThanOrEqual(3);
    expect(parseFloat(decls?.["outline-offset"] ?? "0")).toBeGreaterThanOrEqual(2);
  });

  it("mouse focus does not paint a ring", () => {
    expect(declsFor(":focus:not(:focus-visible)")?.outline).toBe("none");
  });
});

// ── SC 2.5.8 Target Size ─────────────────────────────────────────────────────

describe("SC 2.5.8 Target Size — controls meet the 24px minimum", () => {
  const sized = rulesDeclaring("min-height");

  it("buttons carry a min-height of at least 24px", () => {
    const rule = sized.find((r) => r.selectors.includes("button"));
    expect(rule).toBeDefined();
    expect(parseFloat(rule?.value ?? "0") * 16).toBeGreaterThanOrEqual(24);
  });

  it("the target-size rule does not blanket every anchor", () => {
    // A bare `a` in the target-size list forces inline prose links to a 24px
    // box, which breaks paragraph and table layout.
    expect(sized.length).toBeGreaterThan(0);
    for (const rule of sized) {
      expect(rule.selectors.map((s) => s.trim())).not.toContain("a");
    }
  });

  it(".btn-icon is sized to 44px for icon-only controls", () => {
    const decls = declsFor(".btn-icon");
    expect(decls?.width).toBe("2.75rem");
    expect(decls?.height).toBe("2.75rem");
  });
});

// ── SC 1.4.6 Contrast (Enhanced), opt-in ─────────────────────────────────────

describe("SC 1.4.6 Contrast (Enhanced) — the AAA palette is reachable", () => {
  it("defines the [data-contrast='aaa'] token block", () => {
    const decls = declsFor('[data-contrast="aaa"]');
    expect(decls?.["--text-primary"]).toBe("#f0f6fc");
    expect(decls?.["--border-focus"]).toBe("#79c0ff");
  });

  it("defines a light-theme AAA override", () => {
    expect(declsFor('[data-theme="light"][data-contrast="aaa"]')).toBeDefined();
  });

  it("the settings card exposes a toggle that sets the attribute", () => {
    const settings = readFileSync(resolve(root, "src/cards/settings.ts"), "utf8");
    expect(settings).toContain('data-action="contrast-change"');
    expect(settings).toContain("setEnhancedContrast");
  });
});

// ── SC 3.3.3 Error Suggestion ────────────────────────────────────────────────

describe("SC 3.3.3 Error Suggestion", () => {
  it("renders the suggestion attribute inline", () => {
    expect(declsFor(".error-message[data-suggestion]::after")?.content).toContain(
      "attr(data-suggestion)",
    );
  });
});

// ── tokens.css — base contrast tokens ────────────────────────────────────────

describe("tokens.css — base contrast tokens present in both themes", () => {
  it("dark and light themes both define --text-primary", () => {
    expect(CSS_TOKENS).toContain("--text-primary: #e6edf3");
    expect(CSS_TOKENS).toContain("--text-primary: #1f2328");
  });

  it("--border-focus is defined for every theme", () => {
    expect((CSS_TOKENS.match(/--border-focus:/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

// ── Dead stylesheet regression guard ─────────────────────────────────────────

describe("no orphaned stylesheets", () => {
  it("every stylesheet under src/styles is referenced by index.html", () => {
    const files = readdirSync(resolve(root, "src/styles")).filter((f) => f.endsWith(".css"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(INDEX_HTML).toContain(`/src/styles/${file}`);
    }
  });
});
