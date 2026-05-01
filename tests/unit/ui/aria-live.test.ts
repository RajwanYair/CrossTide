// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { announce, clearAnnouncements } from "../../../src/ui/aria-live";

describe("announce", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates a polite live region on first call", () => {
    expect(announce("hello")).toBe(true);
    const el = document.getElementById("ct-aria-live-region");
    expect(el?.getAttribute("aria-live")).toBe("polite");
    expect(el?.getAttribute("role")).toBe("status");
    expect(el?.textContent).toBe("hello");
  });

  it("creates an assertive region when requested", () => {
    announce("uh oh", "assertive");
    const el = document.getElementById("ct-aria-live-assertive");
    expect(el?.getAttribute("aria-live")).toBe("assertive");
    expect(el?.getAttribute("role")).toBe("alert");
  });

  it("reuses the same region for repeated calls", () => {
    announce("a");
    announce("b");
    expect(document.querySelectorAll("#ct-aria-live-region").length).toBe(1);
    expect(document.getElementById("ct-aria-live-region")?.textContent).toBe("b");
  });

  it("ignores blank messages", () => {
    expect(announce("   ")).toBe(false);
    expect(document.getElementById("ct-aria-live-region")).toBeNull();
  });

  it("clearAnnouncements empties both regions", () => {
    announce("x", "polite");
    announce("y", "assertive");
    clearAnnouncements();
    expect(document.getElementById("ct-aria-live-region")?.textContent).toBe("");
    expect(document.getElementById("ct-aria-live-assertive")?.textContent).toBe("");
  });
});
