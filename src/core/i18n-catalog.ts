/**
 * i18n message catalog & t() helper (J13).
 *
 * Provides a thin translation layer over the ICU formatter:
 *   - `defineMessages(dict)` — define a typed message dictionary
 *   - `createTranslator(messages, locale?)` — create a bound `t(key, values)` fn
 *   - `registerLocale(locale, messages)` — register locale-specific messages
 *   - `t(key, values?)` — look up and format a message using the active locale
 *
 * Messages are simple strings or ICU-subset templates:
 *   "greeting": "Hello, {name}!"
 *   "alerts":   "{count, plural, =0{No alerts} =1{1 alert} other{# alerts}}"
 *
 * Locale fallback: requested locale → base language tag → "en" → raw key.
 *
 * @example
 *   registerLocale("en", { greeting: "Hello, {name}!" });
 *   registerLocale("es", { greeting: "¡Hola, {name}!" });
 *   setLocale("es");
 *   t("greeting", { name: "World" }) // → "¡Hola, World!"
 */

import { format, type MessageValues, type MessageDict } from "./icu-formatter";
import { getLocale } from "./i18n";

// ── Catalog ───────────────────────────────────────────────────────────────

/** Locale → message dict map. */
const _catalogs = new Map<string, MessageDict>();

/**
 * Register a message dictionary for a locale.
 * Merges with any existing messages for that locale (later calls win).
 */
export function registerLocale(locale: string, messages: MessageDict): void {
  const existing = _catalogs.get(locale);
  _catalogs.set(locale, existing ? { ...existing, ...messages } : { ...messages });
}

/**
 * Remove all registered locale catalogs.  Intended for testing only.
 * @internal
 */
export function _resetCatalogsForTests(): void {
  _catalogs.clear();
}

/**
 * Resolve a message template by key, walking the fallback chain:
 *   1. Exact locale (e.g. "pt-BR")
 *   2. Base language (e.g. "pt")
 *   3. English ("en")
 *   4. The raw key itself
 */
function resolveTemplate(key: string, locale: string): string {
  // Exact match
  const exact = _catalogs.get(locale);
  if (exact?.[key] !== undefined) return exact[key];

  // Base language fallback
  const dash = locale.indexOf("-");
  if (dash > 0) {
    const base = locale.slice(0, dash);
    const baseCat = _catalogs.get(base);
    if (baseCat?.[key] !== undefined) return baseCat[key];
  }

  // English fallback
  if (locale !== "en") {
    const en = _catalogs.get("en");
    if (en?.[key] !== undefined) return en[key];
  }

  // Last resort — return the key
  return key;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Translate a message key using the active locale.
 *
 * @param key    Message key registered via `registerLocale`.
 * @param values ICU placeholder values.
 * @returns Formatted string.
 */
export function t(key: string, values?: MessageValues): string {
  const locale = getLocale();
  const template = resolveTemplate(key, locale);
  return values ? format(template, values, locale) : template;
}

/**
 * Create a bound translator for a specific locale (useful for SSR / workers).
 */
export function createTranslator(locale: string): (key: string, values?: MessageValues) => string {
  return (key, values): string => {
    const template = resolveTemplate(key, locale);
    return values ? format(template, values, locale) : template;
  };
}

/**
 * Type-safe message definition helper — identity function that preserves
 * the literal keys for TypeScript inference.
 */
export function defineMessages<T extends MessageDict>(dict: T): T {
  return dict;
}

/**
 * List all registered locale codes.
 */
export function getRegisteredLocales(): string[] {
  return [..._catalogs.keys()];
}

/**
 * Check whether a specific key has a translation for the given locale
 * (or active locale if omitted).
 */
export function hasTranslation(key: string, locale?: string): boolean {
  const loc = locale ?? getLocale();
  const cat = _catalogs.get(loc);
  return cat !== undefined && key in cat;
}
