/**
 * Notification preferences — granular control over which events
 * trigger browser notifications.
 *
 * Stored in localStorage. Users can enable/disable categories independently.
 */

const STORAGE_KEY = "crosstide-notification-prefs";

export interface NotificationPrefs {
  readonly priceAlerts: boolean;
  readonly signalFlips: boolean;
  readonly providerFailovers: boolean;
  readonly dataStale: boolean;
  readonly earningsReminders: boolean;
}

const DEFAULTS: NotificationPrefs = {
  priceAlerts: true,
  signalFlips: true,
  providerFailovers: false,
  dataStale: false,
  earningsReminders: true,
};

let cache: NotificationPrefs | null = null;

function load(): NotificationPrefs {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
      cache = { ...DEFAULTS, ...parsed };
      return cache;
    }
  } catch {
    // ignore
  }
  cache = { ...DEFAULTS };
  return cache;
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(load()));
}

/**
 * Get all notification preferences.
 */
export function getNotificationPrefs(): NotificationPrefs {
  return load();
}

/**
 * Update one or more notification preferences.
 */
export function updateNotificationPrefs(updates: Partial<NotificationPrefs>): void {
  const current = load();
  cache = { ...current, ...updates };
  persist();
}

/**
 * Check if a specific notification category is enabled.
 */
export function isNotificationEnabled(category: keyof NotificationPrefs): boolean {
  return load()[category];
}

/**
 * Enable a notification category.
 */
export function enableNotification(category: keyof NotificationPrefs): void {
  updateNotificationPrefs({ [category]: true });
}

/**
 * Disable a notification category.
 */
export function disableNotification(category: keyof NotificationPrefs): void {
  updateNotificationPrefs({ [category]: false });
}

/**
 * Reset all preferences to defaults.
 */
export function resetNotificationPrefs(): void {
  cache = { ...DEFAULTS };
  persist();
}

/**
 * Get the default preferences.
 */
export function getDefaults(): NotificationPrefs {
  return { ...DEFAULTS };
}
