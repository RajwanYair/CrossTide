import { describe, it, expect, beforeEach } from "vitest";
import { auditScreenReader } from "../../src/ui/screen-reader-audit";

describe("auditScreenReader", () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement("div");
  });

  it("returns no issues for well-structured content", () => {
    root.innerHTML = `
      <header>Banner</header>
      <nav>Navigation</nav>
      <main><h1>Title</h1><p>Content</p></main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    expect(issues).toHaveLength(0);
  });

  it("detects missing landmarks", () => {
    root.innerHTML = "<div>No landmarks</div>";
    const issues = auditScreenReader(root);
    const landmarkIssues = issues.filter((i) => i.rule === "landmark-missing");
    expect(landmarkIssues.length).toBeGreaterThanOrEqual(3);
  });

  it("detects images without alt text", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <img src="test.png">
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const imgIssues = issues.filter((i) => i.rule === "img-alt-missing");
    expect(imgIssues).toHaveLength(1);
  });

  it("allows presentational images without alt", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <img src="test.png" role="presentation">
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const imgIssues = issues.filter((i) => i.rule === "img-alt-missing");
    expect(imgIssues).toHaveLength(0);
  });

  it("detects buttons without accessible names", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <button></button>
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const nameIssues = issues.filter((i) => i.rule === "interactive-no-name");
    expect(nameIssues).toHaveLength(1);
  });

  it("accepts buttons with aria-label", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <button aria-label="Close"></button>
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const nameIssues = issues.filter((i) => i.rule === "interactive-no-name");
    expect(nameIssues).toHaveLength(0);
  });

  it("detects form inputs without labels", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <input type="text">
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const labelIssues = issues.filter((i) => i.rule === "form-input-no-label");
    expect(labelIssues).toHaveLength(1);
  });

  it("skips hidden inputs", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <input type="hidden" name="csrf">
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const labelIssues = issues.filter((i) => i.rule === "form-input-no-label");
    expect(labelIssues).toHaveLength(0);
  });

  it("detects skipped heading levels", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <h1>Title</h1>
        <h3>Skipped h2</h3>
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const headingIssues = issues.filter((i) => i.rule === "heading-order-skip");
    expect(headingIssues).toHaveLength(1);
  });

  it("warns when no live regions exist", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main><h1>T</h1></main>
    `;
    const issues = auditScreenReader(root);
    const liveIssues = issues.filter((i) => i.rule === "no-live-regions");
    expect(liveIssues).toHaveLength(1);
  });

  it("detects SVGs without accessible names", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <svg></svg>
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const svgIssues = issues.filter((i) => i.rule === "svg-accessible-name");
    expect(svgIssues).toHaveLength(1);
  });

  it("accepts SVGs with aria-hidden", () => {
    root.innerHTML = `
      <header>H</header><nav>N</nav><main>
        <svg aria-hidden="true"></svg>
      </main>
      <div aria-live="polite"></div>
    `;
    const issues = auditScreenReader(root);
    const svgIssues = issues.filter((i) => i.rule === "svg-accessible-name");
    expect(svgIssues).toHaveLength(0);
  });
});
