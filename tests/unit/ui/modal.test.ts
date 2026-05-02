import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { openModal, closeModal, isModalOpen } from "../../../src/ui/modal";

describe("modal", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    closeModal();
  });

  afterEach(() => {
    closeModal();
    document.body.innerHTML = "";
  });

  it("opens a modal with title", () => {
    openModal({ title: "Test", content: "Hello" });
    const title = document.querySelector(".modal-title");
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe("Test");
  });

  it("opens a modal with string content", () => {
    openModal({ title: "T", content: "<p>Body</p>" });
    const body = document.querySelector(".modal-body");
    expect(body!.innerHTML).toBe("<p>Body</p>");
  });

  it("opens a modal with HTMLElement content", () => {
    const el = document.createElement("span");
    el.textContent = "Element";
    openModal({ title: "T", content: el });
    const body = document.querySelector(".modal-body");
    expect(body!.querySelector("span")).not.toBeNull();
  });

  it("isModalOpen reflects state", () => {
    expect(isModalOpen()).toBe(false);
    openModal({ title: "T", content: "C" });
    expect(isModalOpen()).toBe(true);
    closeModal();
    expect(isModalOpen()).toBe(false);
  });

  it("has aria attributes", () => {
    openModal({ title: "Accessible", content: "Body" });
    const overlay = document.querySelector(".modal-overlay");
    expect(overlay!.getAttribute("role")).toBe("dialog");
    expect(overlay!.getAttribute("aria-modal")).toBe("true");
    expect(overlay!.getAttribute("aria-label")).toBe("Accessible");
  });

  it("close button has aria-label", () => {
    openModal({ title: "T", content: "C" });
    const btn = document.querySelector(".modal-close");
    expect(btn!.getAttribute("aria-label")).toBe("Close dialog");
  });

  it("only one modal at a time", () => {
    openModal({ title: "First", content: "1" });
    openModal({ title: "Second", content: "2" });
    const overlays = document.querySelectorAll(".modal-overlay");
    expect(overlays).toHaveLength(1);
    expect(document.querySelector(".modal-title")!.textContent).toBe("Second");
  });

  it("calls onClose callback", () => {
    let called = false;
    openModal({
      title: "T",
      content: "C",
      onClose: () => {
        called = true;
      },
    });
    closeModal();
    expect(called).toBe(true);
  });

  it("Escape key closes modal", () => {
    openModal({ title: "T", content: "C" });
    // G9: <dialog> fires "cancel" on Escape; simulate the browser event.
    const dialog = document.querySelector("dialog")!;
    dialog.dispatchEvent(new Event("cancel", { bubbles: false }));
    expect(isModalOpen()).toBe(false);
  });
});
