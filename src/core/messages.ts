/**
 * i18n message catalogue — C1.
 *
 * Provides a minimal ICU-style `t(key, vars?)` translation helper backed by
 * flat key→string catalogues for English (default) and Hebrew (RTL).
 *
 * Variable substitution uses `{varName}` placeholders:
 *   t("greeting", { name: "Ada" })  → "Hello, Ada!"
 *
 * Adding a new locale:
 *   1. Add an entry to the `catalogues` map below.
 *   2. Provide translations for all keys in `Messages`.
 *   3. Call `setLocale("xx")` at runtime to switch.
 *
 * The active locale is read from `getLocale()` in `./i18n`.
 * Fallback for missing keys: returns the English string (or the key itself).
 */
import { getLocale } from "./i18n";

// ── Message key catalogue ──────────────────────────────────────────────────

export interface Messages {
  // ── Navigation ──
  "nav.watchlist": string;
  "nav.consensus": string;
  "nav.chart": string;
  "nav.alerts": string;
  "nav.heatmap": string;
  "nav.screener": string;
  "nav.settings": string;
  "nav.portfolio": string;
  "nav.risk": string;
  "nav.backtest": string;

  // ── Watchlist ──
  "watchlist.addPlaceholder": string;
  "watchlist.addAriaLabel": string;
  "watchlist.empty": string;
  "watchlist.remove": string;
  "watchlist.col.ticker": string;
  "watchlist.col.price": string;
  "watchlist.col.change": string;
  "watchlist.col.signal": string;
  "watchlist.col.volume": string;
  "watchlist.col.range52w": string;

  // ── Consensus ──
  "consensus.title": string;
  "consensus.buy": string;
  "consensus.sell": string;
  "consensus.hold": string;
  "consensus.noData": string;

  // ── Alerts ──
  "alerts.title": string;
  "alerts.noAlerts": string;
  "alerts.triggered": string;
  "alerts.pending": string;
  "alerts.dismiss": string;

  // ── Settings ──
  "settings.title": string;
  "settings.theme": string;
  "settings.theme.dark": string;
  "settings.theme.light": string;
  "settings.theme.system": string;
  "settings.finnhubKey": string;
  "settings.finnhubKey.save": string;
  "settings.finnhubKey.clear": string;
  "settings.export": string;
  "settings.import": string;
  "settings.clearWatchlist": string;
  "settings.clearCache": string;

  // ── Common ──
  "common.loading": string;
  "common.error": string;
  "common.retry": string;
  "common.close": string;
  "common.save": string;
  "common.cancel": string;
  "common.confirm": string;
  "common.search": string;
  "common.noResults": string;
  "common.updated": string;

  // ── Provider health ──
  "providerHealth.title": string;
  "providerHealth.status.ok": string;
  "providerHealth.status.degraded": string;
  "providerHealth.status.down": string;

  // ── Live streaming ──
  "stream.live": string;
  "stream.connecting": string;
  "stream.disconnected": string;
  "stream.error": string;
}

// ── English catalogue ──────────────────────────────────────────────────────

const en: Messages = {
  "nav.watchlist": "Watchlist",
  "nav.consensus": "Consensus",
  "nav.chart": "Chart",
  "nav.alerts": "Alerts",
  "nav.heatmap": "Heatmap",
  "nav.screener": "Screener",
  "nav.settings": "Settings",
  "nav.portfolio": "Portfolio",
  "nav.risk": "Risk",
  "nav.backtest": "Backtest",

  "watchlist.addPlaceholder": "Add ticker…",
  "watchlist.addAriaLabel": "Add ticker to watchlist",
  "watchlist.empty": "No tickers added yet. Type a symbol above and press Enter.",
  "watchlist.remove": "Remove {ticker}",
  "watchlist.col.ticker": "Ticker",
  "watchlist.col.price": "Price",
  "watchlist.col.change": "Change",
  "watchlist.col.signal": "Signal",
  "watchlist.col.volume": "Volume",
  "watchlist.col.range52w": "52W Range",

  "consensus.title": "Consensus",
  "consensus.buy": "Buy",
  "consensus.sell": "Sell",
  "consensus.hold": "Hold",
  "consensus.noData": "No consensus data",

  "alerts.title": "Alerts",
  "alerts.noAlerts": "No alerts configured",
  "alerts.triggered": "Triggered",
  "alerts.pending": "Pending",
  "alerts.dismiss": "Dismiss",

  "settings.title": "Settings",
  "settings.theme": "Theme",
  "settings.theme.dark": "Dark",
  "settings.theme.light": "Light",
  "settings.theme.system": "System",
  "settings.finnhubKey": "Finnhub API Key",
  "settings.finnhubKey.save": "Save",
  "settings.finnhubKey.clear": "Clear",
  "settings.export": "Export Data",
  "settings.import": "Import Data",
  "settings.clearWatchlist": "Clear Watchlist",
  "settings.clearCache": "Clear Cache",

  "common.loading": "Loading…",
  "common.error": "An error occurred",
  "common.retry": "Retry",
  "common.close": "Close",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.search": "Search",
  "common.noResults": "No results",
  "common.updated": "Updated",

  "providerHealth.title": "Provider Health",
  "providerHealth.status.ok": "OK",
  "providerHealth.status.degraded": "Degraded",
  "providerHealth.status.down": "Down",

  "stream.live": "● LIVE",
  "stream.connecting": "Connecting…",
  "stream.disconnected": "Disconnected",
  "stream.error": "Stream error",
};

// ── Hebrew catalogue ───────────────────────────────────────────────────────

const he: Messages = {
  "nav.watchlist": "רשימת מעקב",
  "nav.consensus": "קונצנזוס",
  "nav.chart": "גרף",
  "nav.alerts": "התראות",
  "nav.heatmap": "מפת חום",
  "nav.screener": "סורק",
  "nav.settings": "הגדרות",
  "nav.portfolio": "תיק",
  "nav.risk": "סיכון",
  "nav.backtest": "בדיקה היסטורית",

  "watchlist.addPlaceholder": "הוסף מניה…",
  "watchlist.addAriaLabel": "הוסף מניה לרשימת המעקב",
  "watchlist.empty": "לא נוספו מניות עדיין. הקלד סימול למעלה ולחץ Enter.",
  "watchlist.remove": "הסר {ticker}",
  "watchlist.col.ticker": "סימול",
  "watchlist.col.price": "מחיר",
  "watchlist.col.change": "שינוי",
  "watchlist.col.signal": "איתות",
  "watchlist.col.volume": "נפח",
  "watchlist.col.range52w": "טווח 52 שבועות",

  "consensus.title": "קונצנזוס",
  "consensus.buy": "קנה",
  "consensus.sell": "מכור",
  "consensus.hold": "החזק",
  "consensus.noData": "אין נתוני קונצנזוס",

  "alerts.title": "התראות",
  "alerts.noAlerts": "לא הוגדרו התראות",
  "alerts.triggered": "הופעל",
  "alerts.pending": "ממתין",
  "alerts.dismiss": "סגור",

  "settings.title": "הגדרות",
  "settings.theme": "ערכת נושא",
  "settings.theme.dark": "כהה",
  "settings.theme.light": "בהיר",
  "settings.theme.system": "מערכת",
  "settings.finnhubKey": "מפתח API של Finnhub",
  "settings.finnhubKey.save": "שמור",
  "settings.finnhubKey.clear": "נקה",
  "settings.export": "ייצוא נתונים",
  "settings.import": "ייבוא נתונים",
  "settings.clearWatchlist": "נקה רשימת מעקב",
  "settings.clearCache": "נקה מטמון",

  "common.loading": "טוען…",
  "common.error": "אירעה שגיאה",
  "common.retry": "נסה שוב",
  "common.close": "סגור",
  "common.save": "שמור",
  "common.cancel": "ביטול",
  "common.confirm": "אישור",
  "common.search": "חיפוש",
  "common.noResults": "אין תוצאות",
  "common.updated": "עודכן",

  "providerHealth.title": "בריאות ספקים",
  "providerHealth.status.ok": "תקין",
  "providerHealth.status.degraded": "פגוע",
  "providerHealth.status.down": "מושבת",

  "stream.live": "● חי",
  "stream.connecting": "מתחבר…",
  "stream.disconnected": "מנותק",
  "stream.error": "שגיאת סטרימינג",
};

// ── Catalogue registry ──────────────────────────────────────────────────────

const catalogues = new Map<string, Messages>([
  ["en", en],
  ["he", he],
]);

/**
 * Register a custom locale catalogue at runtime.
 * Useful for plugins or tests that need additional locales.
 */
export function registerCatalogue(locale: string, messages: Messages): void {
  catalogues.set(locale, messages);
}

// ── t() translation helper ──────────────────────────────────────────────────

/**
 * Translate a message key to the active locale's string, with optional variable
 * substitution using `{varName}` placeholders.
 *
 * Falls back to English, then to the key itself if no translation exists.
 *
 * @example
 *   t("common.loading")                // "Loading…"
 *   t("watchlist.remove", { ticker: "AAPL" })  // "Remove AAPL"
 */
export function t(key: keyof Messages, vars?: Record<string, string | number>): string {
  const locale = getLocale();
  const primaryTag = locale.split("-")[0] ?? locale;

  // Try full locale (e.g. "en-US"), then primary tag (e.g. "en"), then "en"
  const catalogue =
    catalogues.get(locale) ?? catalogues.get(primaryTag) ?? catalogues.get("en") ?? en;

  let message: string = catalogue[key] ?? en[key] ?? key;

  if (vars) {
    for (const [varKey, varVal] of Object.entries(vars)) {
      message = message.replaceAll(`{${varKey}}`, String(varVal));
    }
  }

  return message;
}
