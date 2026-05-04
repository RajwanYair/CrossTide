/**
 * Form error identification utilities — WCAG 3.3.1 compliance.
 *
 * Provides accessible error reporting for form inputs:
 * - `aria-invalid` attribute toggling
 * - `aria-describedby` linking input to error message
 * - Live region announcements for screen readers
 * - Consistent error message rendering
 */
import { announce } from "./a11y";

export interface FieldError {
  readonly field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  readonly message: string;
}

/**
 * Mark a form field as invalid and display an accessible error message.
 * Creates or updates an error element linked via `aria-describedby`.
 */
export function showFieldError(
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  message: string,
): void {
  const errorId = getErrorId(field);

  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", errorId);

  let errorEl = document.getElementById(errorId);
  if (!errorEl) {
    errorEl = document.createElement("span");
    errorEl.id = errorId;
    errorEl.className = "field-error";
    errorEl.setAttribute("role", "alert");
    field.parentElement?.insertBefore(errorEl, field.nextSibling);
  }
  errorEl.textContent = message;
}

/**
 * Clear the error state from a form field.
 */
export function clearFieldError(
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
  const errorId = getErrorId(field);

  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");

  const errorEl = document.getElementById(errorId);
  if (errorEl) errorEl.remove();
}

/**
 * Validate multiple fields and announce errors to screen readers.
 * Returns true if all fields are valid.
 */
export function validateAndReport(errors: readonly FieldError[]): boolean {
  if (errors.length === 0) return true;

  const first = errors[0];
  if (!first) return false;

  for (const { field, message } of errors) {
    showFieldError(field, message);
  }

  const summary =
    errors.length === 1 ? first.message : `${String(errors.length)} errors found. ${first.message}`;

  announce(summary, "assertive");

  // Focus the first invalid field
  first.field.focus();
  return false;
}

/**
 * Clear all field errors within a container.
 */
export function clearAllErrors(container: HTMLElement): void {
  const invalidFields = container.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("[aria-invalid]");
  for (const field of invalidFields) {
    clearFieldError(field);
  }
}

function getErrorId(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  const base = field.id || field.name || "field";
  return `${base}-error`;
}
