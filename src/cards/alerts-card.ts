/**
 * Alerts card adapter — CardModule wrapper for the alert history view.
 *
 * Features:
 * - Renders alert history table (from localStorage-persisted records)
 * - Notification permission request button
 * - Fires browser notifications for new alerts
 */
import { renderAlertHistory } from "./alert-history";
import { renderAlertRulesSection } from "./alert-rules-ui";
import type { AlertRecord } from "../types/domain";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from "../core/notifications";
import { playAlertSound } from "../core/alert-sound";
import { patchDOM } from "../core/patch-dom";
import { createDelegate } from "../ui/delegate";
import type { CardModule } from "./registry";

const STORAGE_KEY = "crosstide-alerts";

function loadAlerts(): AlertRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as AlertRecord[];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: readonly AlertRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function pushAlert(alert: AlertRecord): void {
  const alerts = loadAlerts();
  alerts.unshift(alert);
  // Keep last 200 alerts
  if (alerts.length > 200) alerts.length = 200;
  saveAlerts(alerts);

  // Fire browser notification if permission granted
  if (getNotificationPermission() === "granted") {
    showNotification(`${alert.ticker} — ${alert.direction}`, {
      body: alert.description,
      tag: `alert-${alert.ticker}-${alert.firedAt}`,
    });
  }

  // Play audible chime
  playAlertSound();
}

function renderPermissionUI(container: HTMLElement): void {
  if (!isNotificationsSupported()) return;

  const perm = getNotificationPermission();
  let wrapper = container.querySelector<HTMLElement>(".notification-perm");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "notification-perm";
    container.prepend(wrapper);
  }

  if (perm === "granted") {
    patchDOM(wrapper, `<span class="badge badge-buy">Notifications enabled</span>`);
  } else if (perm === "denied") {
    patchDOM(wrapper, `<span class="badge badge-sell">Notifications blocked</span>`);
  } else {
    patchDOM(
      wrapper,
      `<button class="btn btn-sm" data-action="enable-notify">Enable Notifications</button>`,
    );
  }
}

const alertsCard: CardModule = {
  mount(container, _ctx) {
    const alerts = loadAlerts();

    // Rules section at top
    const rulesSection = document.createElement("section");
    rulesSection.className = "alert-rules-section";
    container.appendChild(rulesSection);
    const { delegate: rulesDelegate, refresh: refreshRules } =
      renderAlertRulesSection(rulesSection);

    // History section below
    const historySection = document.createElement("div");
    historySection.className = "alert-history-section";
    container.appendChild(historySection);

    renderAlertHistory(historySection, alerts);
    renderPermissionUI(container);

    const delegate = createDelegate(container, {
      "enable-notify": () => {
        void requestNotificationPermission().then(() => {
          renderPermissionUI(container);
        });
      },
    });

    return {
      update(): void {
        const freshAlerts = loadAlerts();
        renderAlertHistory(historySection, freshAlerts);
        renderPermissionUI(container);
        refreshRules();
      },
      dispose(): void {
        delegate.dispose();
        rulesDelegate.dispose();
      },
    };
  },
};

export default alertsCard;
