/**
 * Locale barrel — import this module to register all available locales.
 *
 * Locales are loaded eagerly (small dictionaries, no lazy-loading needed).
 * The active locale is determined by `getLocale()` from `src/core/i18n.ts`.
 */
import "./en";
import "./es";
import "./de";
import "./zh";

/** Supported locale codes. */
export const SUPPORTED_LOCALES = ["en", "es", "de", "zh", "he"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Human-readable locale labels for settings UI. */
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  zh: "中文",
  he: "עברית",
};
