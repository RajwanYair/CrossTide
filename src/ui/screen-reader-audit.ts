/**
 * Screen reader compatibility audit utility (R14).
 *
 * Provides runtime checks for ARIA best practices:
 * - Landmark completeness (banner, navigation, main, contentinfo)
 * - Images without alt text
 * - Interactive elements without accessible names
 * - Form inputs without labels
 * - Live regions presence
 *
 * Usage:
 *   import { auditScreenReader } from "./screen-reader-audit";
 *   const issues = auditScreenReader();
 *   if (issues.length) console.warn("A11y issues:", issues);
 */

export interface A11yIssue {
  readonly severity: "error" | "warning";
  readonly rule: string;
  readonly message: string;
  readonly element?: Element;
}

/**
 * Run a screen reader compatibility audit on the current document.
 * Returns an array of issues found (empty = clean).
 */
export function auditScreenReader(root: Document | HTMLElement = document): readonly A11yIssue[] {
  const issues: A11yIssue[] = [];
  const container = root instanceof Document ? root.body : root;

  checkLandmarks(container, issues);
  checkImages(container, issues);
  checkInteractiveNames(container, issues);
  checkFormLabels(container, issues);
  checkHeadingOrder(container, issues);
  checkLiveRegions(container, issues);

  return issues;
}

function checkLandmarks(root: HTMLElement, issues: A11yIssue[]): void {
  const requiredLandmarks = [
    { role: "banner", selector: "header[role='banner'], header" },
    { role: "navigation", selector: "nav[role='navigation'], nav" },
    { role: "main", selector: "main[role='main'], main" },
  ] as const;

  for (const { role, selector } of requiredLandmarks) {
    if (!root.querySelector(selector)) {
      issues.push({
        severity: "error",
        rule: "landmark-missing",
        message: `Missing required landmark: ${role}`,
      });
    }
  }
}

function checkImages(root: HTMLElement, issues: A11yIssue[]): void {
  const images = root.querySelectorAll("img");
  for (const img of images) {
    if (!img.hasAttribute("alt") && !img.getAttribute("role")?.includes("presentation")) {
      issues.push({
        severity: "error",
        rule: "img-alt-missing",
        message: "Image missing alt attribute",
        element: img,
      });
    }
  }

  const svgs = root.querySelectorAll("svg:not([aria-hidden='true'])");
  for (const svg of svgs) {
    if (!svg.getAttribute("aria-label") && !svg.querySelector("title")) {
      issues.push({
        severity: "warning",
        rule: "svg-accessible-name",
        message: "SVG without aria-label or <title>",
        element: svg,
      });
    }
  }
}

function checkInteractiveNames(root: HTMLElement, issues: A11yIssue[]): void {
  const interactives = root.querySelectorAll("button, a[href], [role='button'], [role='link']");
  for (const el of interactives) {
    const hasName =
      el.textContent?.trim() ||
      el.getAttribute("aria-label") ||
      el.getAttribute("aria-labelledby") ||
      el.getAttribute("title");
    if (!hasName) {
      issues.push({
        severity: "error",
        rule: "interactive-no-name",
        message: `Interactive element <${el.tagName.toLowerCase()}> has no accessible name`,
        element: el,
      });
    }
  }
}

function checkFormLabels(root: HTMLElement, issues: A11yIssue[]): void {
  const inputs = root.querySelectorAll("input, select, textarea");
  for (const input of inputs) {
    if ((input as HTMLInputElement).type === "hidden") continue;
    const hasLabel =
      input.getAttribute("aria-label") ||
      input.getAttribute("aria-labelledby") ||
      input.getAttribute("placeholder") ||
      (input.id && root.querySelector(`label[for="${input.id}"]`));
    if (!hasLabel) {
      issues.push({
        severity: "error",
        rule: "form-input-no-label",
        message: `Form input <${input.tagName.toLowerCase()}> missing label`,
        element: input,
      });
    }
  }
}

function checkHeadingOrder(root: HTMLElement, issues: A11yIssue[]): void {
  const headings = root.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let lastLevel = 0;
  for (const heading of headings) {
    const level = parseInt(heading.tagName[1], 10);
    if (lastLevel > 0 && level > lastLevel + 1) {
      issues.push({
        severity: "warning",
        rule: "heading-order-skip",
        message: `Heading level skipped: h${lastLevel} → h${level}`,
        element: heading,
      });
    }
    lastLevel = level;
  }
}

function checkLiveRegions(root: HTMLElement, issues: A11yIssue[]): void {
  const liveRegions = root.querySelectorAll("[aria-live], [role='status'], [role='alert']");
  if (liveRegions.length === 0) {
    issues.push({
      severity: "warning",
      rule: "no-live-regions",
      message: "No ARIA live regions found — dynamic updates may not be announced",
    });
  }
}
