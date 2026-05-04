/**
 * Unit tests for `<ct-empty-state>` Web Component (P11).
 */
import { describe, it, expect, beforeEach } from "vitest";
import "../../../src/ui/empty-state";
import type { CtEmptyState } from "../../../src/ui/empty-state";

function createElement(): CtEmptyState {
  return document.createElement("ct-empty-state") as CtEmptyState;
}

describe("ct-empty-state", () => {
  let el: CtEmptyState;

  beforeEach(() => {
    el = createElement();
  });

  it("is defined as a custom element", () => {
    expect(customElements.get("ct-empty-state")).toBeDefined();
  });

  it("renders empty variant by default", () => {
    document.body.appendChild(el);

    const container = el.querySelector(".ct-es--empty");
    expect(container).not.toBeNull();
    expect(container!.getAttribute("role")).toBe("status");
    expect(container!.getAttribute("aria-live")).toBe("polite");

    document.body.removeChild(el);
  });

  it("renders title and description", () => {
    el.title = "No data";
    el.description = "Add tickers to get started";
    document.body.appendChild(el);

    expect(el.querySelector(".ct-es-title")!.textContent).toBe("No data");
    expect(el.querySelector(".ct-es-desc")!.textContent).toBe("Add tickers to get started");

    document.body.removeChild(el);
  });

  it("renders loading variant with spinner", () => {
    el.variant = "loading";
    el.title = "Loading…";
    document.body.appendChild(el);

    expect(el.querySelector(".ct-es--loading")).not.toBeNull();
    expect(el.querySelector(".ct-es-spinner")).not.toBeNull();
    expect(el.querySelector('[role="status"]')).not.toBeNull();

    document.body.removeChild(el);
  });

  it("renders error variant with warning icon", () => {
    el.variant = "error";
    el.title = "Something went wrong";
    el.description = "Please try again";
    document.body.appendChild(el);

    expect(el.querySelector(".ct-es--error")).not.toBeNull();
    expect(el.querySelector(".ct-es-icon--error")).not.toBeNull();
    expect(el.querySelector(".ct-es-title")!.textContent).toBe("Something went wrong");

    document.body.removeChild(el);
  });

  it("syncs from attributes on connect", () => {
    el.setAttribute("variant", "error");
    el.setAttribute("title", "Error title");
    el.setAttribute("description", "Desc");
    document.body.appendChild(el);

    expect(el.variant).toBe("error");
    expect(el.title).toBe("Error title");
    expect(el.description).toBe("Desc");

    document.body.removeChild(el);
  });

  it("responds to attribute changes", () => {
    document.body.appendChild(el);

    el.setAttribute("variant", "loading");
    expect(el.querySelector(".ct-es--loading")).not.toBeNull();

    el.setAttribute("variant", "error");
    expect(el.querySelector(".ct-es--error")).not.toBeNull();

    document.body.removeChild(el);
  });

  it("escapes HTML in title and description", () => {
    el.title = "<img onerror=alert(1)>";
    el.description = "<script>bad</script>";
    document.body.appendChild(el);

    expect(el.querySelector(".ct-es-title")!.textContent).toBe("<img onerror=alert(1)>");
    expect(el.querySelector(".ct-es-desc")!.innerHTML).not.toContain("<script>");

    document.body.removeChild(el);
  });

  it("re-renders when properties change after connect", () => {
    document.body.appendChild(el);

    el.variant = "loading";
    el.title = "Please wait";
    expect(el.querySelector(".ct-es--loading")).not.toBeNull();
    expect(el.querySelector(".ct-es-title")!.textContent).toBe("Please wait");

    document.body.removeChild(el);
  });

  it("omits title/description elements when not provided", () => {
    document.body.appendChild(el);

    expect(el.querySelector(".ct-es-title")).toBeNull();
    expect(el.querySelector(".ct-es-desc")).toBeNull();

    document.body.removeChild(el);
  });
});
