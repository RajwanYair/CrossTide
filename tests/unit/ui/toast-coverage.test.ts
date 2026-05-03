/**
 * Coverage tests for src/ui/toast.ts
 * Targets uncovered lines:
 *  - 62-63: container.hidePopover() in dismiss() when last toast dismissed + popover supported
 *  - 70: animationend path — when getAnimations() returns non-empty
 *  - 96-97: parent.showPopover() in showToast() when first toast + popover supported
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { showToast, clearAllToasts } from "../../../src/ui/toast";

// ── Popover API stub ──────────────────────────────────────────────────────────

function stubPopoverApi(): () => void {
  const showPopoverFn = vi.fn();
  const hidePopoverFn = vi.fn();
  Object.assign(HTMLElement.prototype, {
    showPopover: showPopoverFn,
    hidePopover: hidePopoverFn,
  });
  return () => {
    delete (HTMLElement.prototype as Record<string, unknown>).showPopover;
    delete (HTMLElement.prototype as Record<string, unknown>).hidePopover;
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("toast — Popover API paths (lines 62-63, 96-97)", () => {
  let restorePopover: () => void;

  beforeEach(() => {
    document.body.innerHTML = "";
    clearAllToasts();
    restorePopover = stubPopoverApi();
  });

  afterEach(() => {
    clearAllToasts();
    document.body.innerHTML = "";
    restorePopover();
    vi.restoreAllMocks();
  });

  it("calls showPopover on container when first toast arrives (line 96-97)", () => {
    // Before any toast, no container exists
    expect(document.getElementById("toast-container")).toBeNull();

    const dismiss = showToast({ message: "first toast", durationMs: 0 });

    const containerEl = document.getElementById("toast-container")!;
    // showPopover should have been called on the container
    expect(
      (containerEl as unknown as { showPopover: ReturnType<typeof vi.fn> }).showPopover,
    ).toHaveBeenCalledTimes(1);

    dismiss();
  });

  it("does not call showPopover again for second toast (activeToasts already has one)", () => {
    const dismiss1 = showToast({ message: "first", durationMs: 0 });
    const containerEl = document.getElementById("toast-container")!;
    const showPopoverMock = (containerEl as unknown as { showPopover: ReturnType<typeof vi.fn> })
      .showPopover;
    const callsBefore = showPopoverMock.mock.calls.length;

    showToast({ message: "second", durationMs: 0 });

    // showPopover should NOT have been called again (it was already open)
    expect(showPopoverMock.mock.calls.length).toBe(callsBefore);

    dismiss1();
    clearAllToasts();
  });

  it("calls hidePopover on container when last toast is dismissed (lines 62-63)", () => {
    const dismiss = showToast({ message: "toast to dismiss", durationMs: 0 });
    const containerEl = document.getElementById("toast-container")!;
    const hidePopoverMock = vi.fn();
    (containerEl as unknown as { hidePopover: typeof hidePopoverMock }).hidePopover =
      hidePopoverMock;

    dismiss(); // Dismisses the only toast → onEnd fires synchronously (no animations)

    expect(hidePopoverMock).toHaveBeenCalledTimes(1);
  });
});

describe("toast — animationend path (line 70)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    clearAllToasts();
  });

  afterEach(() => {
    clearAllToasts();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("listens for animationend when getAnimations returns non-empty array (line 70)", () => {
    const dismiss = showToast({ message: "animated", durationMs: 0 });
    const containerEl = document.getElementById("toast-container")!;
    const toastEl = containerEl.querySelector(".toast") as HTMLElement;

    // Stub getAnimations to return a fake animation (may not exist in happy-dom)
    const fakeAnimation = {} as Animation;
    (toastEl as unknown as Record<string, unknown>).getAnimations = vi
      .fn()
      .mockReturnValue([fakeAnimation]);
    const addEventSpy = vi.spyOn(toastEl, "addEventListener");

    dismiss(); // calls dismiss(toast) → checks getAnimations

    // animationend listener should have been added
    expect(addEventSpy).toHaveBeenCalledWith("animationend", expect.any(Function), { once: true });

    // Simulate the animationend event to complete the flow
    const [, onEnd] = addEventSpy.mock.calls.find(([type]) => type === "animationend")!;
    (onEnd as () => void)();
  });
});
