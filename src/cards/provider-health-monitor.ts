/**
 * Provider Health Monitor — detects provider degradation/outage
 * transitions and fires toast notifications to alert the user.
 *
 * Integrates with the provider-health-card's refresh cycle.
 * Only fires once per state transition (not on every poll).
 */
import { showNotification } from "../core/notifications";
import { patchDOM } from "../core/patch-dom";
import { computeHealthSummary, type ProviderHealthSnapshot } from "./provider-health";

export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";

let lastStatus: HealthStatus = "unknown";

/**
 * Classify the overall health status from a snapshot.
 */
export function classifyHealth(snapshot: ProviderHealthSnapshot): HealthStatus {
  if (snapshot.providers.length === 0) return "unknown";
  const summary = computeHealthSummary(snapshot);
  if (summary.allDown) return "down";
  if (summary.degraded) return "degraded";
  return "healthy";
}

/**
 * Check the health snapshot and fire a notification if the status
 * transitioned to a worse state. Call this on every refresh poll.
 *
 * Returns the new status for testing/inspection.
 */
export function checkHealthTransition(snapshot: ProviderHealthSnapshot): HealthStatus {
  const current = classifyHealth(snapshot);

  if (current === lastStatus || current === "unknown") {
    lastStatus = current;
    return current;
  }

  // Only notify on degradation (transition to worse state)
  if (current === "degraded" && lastStatus !== "down") {
    fireHealthAlert(
      "Provider Degraded",
      `Some data providers are unreachable. Market data may be delayed.`,
    );
  } else if (current === "down") {
    fireHealthAlert(
      "All Providers Down",
      `All data providers are unreachable. Real-time data is unavailable.`,
    );
  } else if (current === "healthy" && lastStatus !== "unknown") {
    // Recovery notification
    fireHealthAlert("Providers Recovered", `All data providers are back online.`);
  }

  lastStatus = current;
  return current;
}

/**
 * Fire a toast + browser notification for health transitions.
 */
function fireHealthAlert(title: string, body: string): void {
  // Browser notification (if permission granted)
  showNotification(title, {
    body,
    tag: "provider-health",
    icon: "/manifest.json",
  });

  // In-page toast (DOM-based, no dependency on toast lib)
  showToast(title, body);
}

/**
 * Simple DOM-based toast notification (auto-dismisses after 5s).
 */
function showToast(title: string, body: string): void {
  const container = document.getElementById("toast-container") ?? createToastContainer();
  const toast = document.createElement("div");
  toast.className = "toast toast-health";
  toast.setAttribute("role", "alert");
  patchDOM(
    toast,
    `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span><button class="toast-dismiss" aria-label="Dismiss notification" type="button">&times;</button>`,
  );

  const dismissBtn = toast.querySelector<HTMLButtonElement>(".toast-dismiss");
  const dismiss = (): void => {
    toast.classList.add("toast-exit");
    setTimeout(() => toast.remove(), 300);
  };
  dismissBtn?.addEventListener("click", dismiss);
  container.appendChild(toast);

  // Auto-dismiss after 5s
  const timer = setTimeout(dismiss, 5000);
  dismissBtn?.addEventListener("click", () => clearTimeout(timer));
}

function createToastContainer(): HTMLElement {
  const el = document.createElement("div");
  el.id = "toast-container";
  el.setAttribute("aria-live", "polite");
  document.body.appendChild(el);
  return el;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Reset for testing. */
export function resetHealthMonitor(): void {
  lastStatus = "unknown";
}
