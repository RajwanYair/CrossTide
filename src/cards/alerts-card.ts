/**
 * Alerts card adapter — CardModule wrapper for the alert history view.
 *
 * Features:
 * - Renders alert history table (from localStorage-persisted records)
 * - Notification permission request button
 * - Fires browser notifications for new alerts
 */
import { renderAlertHistory } from "./alert-history";
import type { AlertRecord } from "../types/domain";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from "../core/notifications";
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
}

function renderPermissionUI(container: HTMLElement): void {
  if (!isNotificationsSupported()) return;

  const perm = getNotificationPermission();
  const wrapper = document.createElement("div");
  wrapper.className = "notification-perm";

  if (perm === "granted") {
    wrapper.innerHTML = `<span class="badge badge-buy">Notifications enabled</span>`;
  } else if (perm === "denied") {
    wrapper.innerHTML = `<span class="badge badge-sell">Notifications blocked</span>`;
  } else {
    wrapper.innerHTML = `<button class="btn btn-sm" id="btn-enable-notify">Enable Notifications</button>`;
    container.prepend(wrapper);
    wrapper.querySelector("#btn-enable-notify")?.addEventListener("click", () => {
      void requestNotificationPermission().then((result) => {
        if (result === "granted") {
          wrapper.innerHTML = `<span class="badge badge-buy">Notifications enabled</span>`;
        } else {
          wrapper.innerHTML = `<span class="badge badge-sell">Notifications denied</span>`;
        }
      });
    });
    return;
  }
  container.prepend(wrapper);
}

const alertsCard: CardModule = {
  mount(container, _ctx) {
    const alerts = loadAlerts();
    renderAlertHistory(container, alerts);
    renderPermissionUI(container);
    return {
      update(): void {
        const freshAlerts = loadAlerts();
        renderAlertHistory(container, freshAlerts);
        renderPermissionUI(container);
      },
    };
  },
};

export default alertsCard;
