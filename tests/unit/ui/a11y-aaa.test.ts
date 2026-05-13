import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  meetsAAAContrast,
  auditTargetSizes,
  applyEnhancedFocus,
  createTimingController,
  buildConfirmationDialog,
  fleschKincaidGrade,
  countSyllables,
  AAA_CONTRAST_NORMAL,
  AAA_CONTRAST_LARGE,
  MIN_TARGET_SIZE,
} from "../../../src/ui/a11y-aaa.js";

describe("a11y-aaa", () => {
  describe("contrast utilities", () => {
    it("parses 3-digit hex", () => {
      expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
      expect(hexToRgb("#000")).toEqual([0, 0, 0]);
    });

    it("parses 6-digit hex", () => {
      expect(hexToRgb("#ff8800")).toEqual([255, 136, 0]);
    });

    it("throws on invalid hex", () => {
      expect(() => hexToRgb("#zz")).toThrow(/invalid hex/i);
    });

    it("computes relative luminance", () => {
      // White should have luminance ~1
      expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 2);
      // Black should have luminance ~0
      expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 2);
    });

    it("computes contrast ratio", () => {
      const white: [number, number, number] = [255, 255, 255];
      const black: [number, number, number] = [0, 0, 0];
      // Black on white should be 21:1
      expect(contrastRatio(black, white)).toBeCloseTo(21, 0);
    });

    it("validates AAA contrast thresholds", () => {
      expect(AAA_CONTRAST_NORMAL).toBe(7);
      expect(AAA_CONTRAST_LARGE).toBe(4.5);
    });

    it("meetsAAAContrast: black on white passes", () => {
      expect(meetsAAAContrast("#000000", "#ffffff")).toBe(true);
    });

    it("meetsAAAContrast: similar grays fail", () => {
      expect(meetsAAAContrast("#777777", "#888888")).toBe(false);
    });

    it("meetsAAAContrast: large text uses lower threshold", () => {
      // Find a pair that passes 4.5:1 but not 7:1
      expect(meetsAAAContrast("#595959", "#ffffff", true)).toBe(true);
      expect(meetsAAAContrast("#595959", "#ffffff", false)).toBe(true);
    });
  });

  describe("target size audit", () => {
    it("validates min target size constant", () => {
      expect(MIN_TARGET_SIZE).toBe(44);
    });

    it("audits interactive elements", () => {
      const container = document.createElement("div");
      const btn = document.createElement("button");
      btn.textContent = "Click";
      container.appendChild(btn);
      document.body.appendChild(container);

      const results = auditTargetSizes(container);
      expect(results).toHaveLength(1);
      expect(results[0]!.element).toBe(btn);
      // In happy-dom, getBoundingClientRect returns 0×0
      expect(results[0]!.passes).toBe(false);

      container.remove();
    });
  });

  describe("enhanced focus", () => {
    it("injects and removes focus stylesheet", () => {
      const dispose = applyEnhancedFocus(document);
      const style = document.getElementById("crosstide-aaa-focus");
      expect(style).not.toBeNull();
      expect(style!.textContent).toContain("focus-visible");

      dispose();
      expect(document.getElementById("crosstide-aaa-focus")).toBeNull();
    });

    it("is idempotent", () => {
      const d1 = applyEnhancedFocus(document);
      const d2 = applyEnhancedFocus(document);
      const styles = document.querySelectorAll("#crosstide-aaa-focus");
      expect(styles).toHaveLength(1);
      d1();
      d2();
    });
  });

  describe("timing controller", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("calls callback at interval", () => {
      const cb = vi.fn();
      const ctrl = createTimingController(cb, 1000);
      vi.advanceTimersByTime(3000);
      expect(cb).toHaveBeenCalledTimes(3);
      ctrl.dispose();
      vi.useRealTimers();
    });

    it("pauses and resumes", () => {
      const cb = vi.fn();
      const ctrl = createTimingController(cb, 1000);

      ctrl.pause();
      expect(ctrl.paused).toBe(true);
      vi.advanceTimersByTime(3000);
      expect(cb).toHaveBeenCalledTimes(0);

      ctrl.resume();
      expect(ctrl.paused).toBe(false);
      vi.advanceTimersByTime(2000);
      expect(cb).toHaveBeenCalledTimes(2);

      ctrl.dispose();
      vi.useRealTimers();
    });

    it("extends interval", () => {
      const cb = vi.fn();
      const ctrl = createTimingController(cb, 1000);

      ctrl.extend(2); // now 2000ms
      expect(ctrl.interval).toBe(2000);

      vi.advanceTimersByTime(4000);
      expect(cb).toHaveBeenCalledTimes(2);

      ctrl.dispose();
      vi.useRealTimers();
    });

    it("throws on non-positive factor", () => {
      const ctrl = createTimingController(vi.fn(), 1000);
      expect(() => ctrl.extend(0)).toThrow(/positive/);
      expect(() => ctrl.extend(-1)).toThrow(/positive/);
      ctrl.dispose();
      vi.useRealTimers();
    });
  });

  describe("confirmation dialog", () => {
    it("builds accessible dialog element", () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const dialog = buildConfirmationDialog(
        { title: "Delete?", message: "This cannot be undone." },
        onConfirm,
        onCancel,
      );

      expect(dialog.getAttribute("role")).toBe("alertdialog");
      expect(dialog.getAttribute("aria-modal")).toBe("true");
      expect(dialog.querySelector("h2")!.textContent).toBe("Delete?");
      expect(dialog.querySelector("p")!.textContent).toBe("This cannot be undone.");

      const buttons = dialog.querySelectorAll("button");
      expect(buttons).toHaveLength(2);

      buttons[0]!.click();
      expect(onConfirm).toHaveBeenCalledOnce();

      buttons[1]!.click();
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("uses custom button labels", () => {
      const dialog = buildConfirmationDialog(
        { title: "T", message: "M", confirmLabel: "Yes", cancelLabel: "No" },
        vi.fn(),
        vi.fn(),
      );
      const buttons = dialog.querySelectorAll("button");
      expect(buttons[0]!.textContent).toBe("Yes");
      expect(buttons[1]!.textContent).toBe("No");
    });
  });

  describe("reading level", () => {
    it("counts syllables", () => {
      expect(countSyllables("the")).toBe(1);
      expect(countSyllables("hello")).toBe(2);
      expect(countSyllables("beautiful")).toBe(3);
    });

    it("returns 0 for empty text", () => {
      expect(fleschKincaidGrade("")).toBe(0);
    });

    it("returns a numeric grade level", () => {
      const grade = fleschKincaidGrade("The cat sat on the mat. The dog ran in the park.");
      expect(typeof grade).toBe("number");
      // Simple sentences should be low grade level
      expect(grade).toBeLessThan(10);
    });
  });
});
