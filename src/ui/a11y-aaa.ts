/**
 * WCAG 2.2 AAA utilities for critical paths — R4
 *
 * Extends the base a11y module with AAA-level compliance checks and helpers:
 *
 *  - **Enhanced contrast** (7:1 for normal text, 4.5:1 for large text)
 *  - **Target size** (44×44 CSS px minimum for pointer targets)
 *  - **Error prevention** (confirmation for financial actions)
 *  - **Focus visible** (enhanced 3px outline with offset)
 *  - **Timing adjustable** (extend/pause/hide for auto-updating content)
 *  - **Reading level** — Flesch–Kincaid readability estimator
 */

// ── Contrast (SC 1.4.6 — AAA enhanced) ──────────────────────────────────────

/**
 * Parse a hex colour string (#RGB or #RRGGBB) into linear-light sRGB components.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  let r: number, g: number, b: number;
  if (h.length === 3) {
    r = parseInt(h[0]! + h[0]!, 16);
    g = parseInt(h[1]! + h[1]!, 16);
    b = parseInt(h[2]! + h[2]!, 16);
  } else if (h.length === 6) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  return [r, g, b];
}

/**
 * Compute relative luminance per WCAG 2.x (using sRGB linearization).
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Compute contrast ratio between two colours (each as [R, G, B] 0-255).
 * Result is always ≥ 1.
 */
export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(...fg);
  const l2 = relativeLuminance(...bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** AAA thresholds per WCAG SC 1.4.6 */
export const AAA_CONTRAST_NORMAL = 7;
export const AAA_CONTRAST_LARGE = 4.5;

/**
 * Check if two hex colours meet AAA contrast for normal-size text (7:1).
 */
export function meetsAAAContrast(fgHex: string, bgHex: string, large = false): boolean {
  const ratio = contrastRatio(hexToRgb(fgHex), hexToRgb(bgHex));
  return ratio >= (large ? AAA_CONTRAST_LARGE : AAA_CONTRAST_NORMAL);
}

// ── Target size (SC 2.5.5 — AAA) ────────────────────────────────────────────

/** Minimum pointer target size in CSS pixels (WCAG 2.2 AAA). */
export const MIN_TARGET_SIZE = 44;

export interface TargetSizeResult {
  readonly element: Element;
  readonly width: number;
  readonly height: number;
  readonly passes: boolean;
}

/**
 * Audit all interactive elements inside a container for AAA target size
 * (44×44 CSS px minimum).
 */
export function auditTargetSizes(container: Element): TargetSizeResult[] {
  const selector =
    'a[href], button, input, select, textarea, [role="button"], [role="link"], [tabindex]';
  const targets = container.querySelectorAll(selector);
  const results: TargetSizeResult[] = [];

  for (const el of targets) {
    const rect = el.getBoundingClientRect();
    results.push({
      element: el,
      width: rect.width,
      height: rect.height,
      passes: rect.width >= MIN_TARGET_SIZE && rect.height >= MIN_TARGET_SIZE,
    });
  }

  return results;
}

// ── Focus visible (SC 2.4.13 — AAA enhanced) ────────────────────────────────

/**
 * Apply AAA-enhanced focus-visible styles via a stylesheet injection.
 * Creates a <style> element if not already present.
 * Returns a dispose function that removes the stylesheet.
 */
export function applyEnhancedFocus(doc: Document = document): () => void {
  const id = "crosstide-aaa-focus";
  if (doc.getElementById(id)) return () => {};

  const style = doc.createElement("style");
  style.id = id;
  style.textContent = `
    *:focus-visible {
      outline: 3px solid #005fcc !important;
      outline-offset: 2px !important;
    }
  `;
  doc.head.appendChild(style);

  return () => style.remove();
}

// ── Timing adjustable (SC 2.2.3 — AAA) ──────────────────────────────────────

export interface TimingController {
  /** Pause auto-update. */
  pause(): void;
  /** Resume auto-update. */
  resume(): void;
  /** Extend the current interval by the given factor. */
  extend(factor: number): void;
  /** Current interval in ms. */
  readonly interval: number;
  /** Whether currently paused. */
  readonly paused: boolean;
  /** Dispose the timing controller. */
  dispose(): void;
}

/**
 * Create a timing controller that wraps `setInterval` with pause / extend
 * controls. This satisfies WCAG 2.2.3 (No Timing — AAA) by allowing users
 * to adjust auto-refresh rates.
 */
export function createTimingController(
  callback: () => void,
  initialIntervalMs: number,
): TimingController {
  let intervalMs = initialIntervalMs;
  let paused = false;
  let timerId: ReturnType<typeof setInterval> | null = null;

  function start(): void {
    stop();
    if (!paused) {
      timerId = setInterval(callback, intervalMs);
    }
  }

  function stop(): void {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  start();

  return {
    get interval(): number {
      return intervalMs;
    },
    get paused(): boolean {
      return paused;
    },

    pause(): void {
      paused = true;
      stop();
    },

    resume(): void {
      paused = false;
      start();
    },

    extend(factor: number): void {
      if (factor <= 0) throw new RangeError("Factor must be positive");
      intervalMs = Math.round(intervalMs * factor);
      if (!paused) start();
    },

    dispose(): void {
      stop();
      paused = true;
    },
  };
}

// ── Error prevention (SC 3.3.6 — AAA) ───────────────────────────────────────

export interface ConfirmationOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

/**
 * Build a confirmation dialog DOM fragment for error prevention on
 * financial/irreversible actions (WCAG SC 3.3.6).
 *
 * Returns the container element; the caller is responsible for appending
 * it to the DOM and handling the confirm/cancel callbacks.
 */
export function buildConfirmationDialog(
  options: ConfirmationOptions,
  onConfirm: () => void,
  onCancel: () => void,
): HTMLElement {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", options.title);

  const heading = document.createElement("h2");
  heading.textContent = options.title;

  const msg = document.createElement("p");
  msg.textContent = options.message;

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = options.confirmLabel ?? "Confirm";
  confirmBtn.addEventListener("click", onConfirm);

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = options.cancelLabel ?? "Cancel";
  cancelBtn.addEventListener("click", onCancel);

  dialog.append(heading, msg, confirmBtn, cancelBtn);
  return dialog;
}

// ── Reading level (SC 3.1.5 — AAA) ──────────────────────────────────────────

/**
 * Estimate the Flesch–Kincaid Grade Level of a text.
 * A lower grade level means easier reading.
 *
 * Returns the approximate US school grade level (e.g., 8 = 8th grade).
 */
export function fleschKincaidGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  return 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
}

/**
 * Rough syllable count heuristic for English text.
 */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 2) return 1;

  let count = 0;
  const vowels = /[aeiouy]/;
  let prevVowel = false;

  for (const ch of w) {
    const isVowel = vowels.test(ch);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Subtract silent e
  if (w.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}
