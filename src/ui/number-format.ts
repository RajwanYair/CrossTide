/**
 * Locale-aware number formatters for prices, volumes, percentages, and
 * compact figures. Built on `Intl.NumberFormat`; cached per locale +
 * options to avoid repeated construction in hot render paths.
 */

const cache = new Map<string, Intl.NumberFormat>();

function fmt(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, options);
    cache.set(key, f);
  }
  return f;
}

export interface FormatOptions {
  readonly locale?: string;
  readonly currency?: string;
  readonly minDigits?: number;
  readonly maxDigits?: number;
}

const DEFAULT_LOCALE = "en-US";

/** Price with adaptive precision: < $1 shows 4 decimals, otherwise 2. */
export function formatPrice(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) return "—";
  const locale = options.locale ?? DEFAULT_LOCALE;
  const min = options.minDigits ?? (Math.abs(value) < 1 ? 4 : 2);
  const max = options.maxDigits ?? min;
  if (options.currency) {
    return fmt(locale, {
      style: "currency",
      currency: options.currency,
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(value);
  }
  return fmt(locale, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(value);
}

/** Compact volume / market cap: 1.2K, 3.4M, 5.6B. */
export function formatCompact(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) return "—";
  const locale = options.locale ?? DEFAULT_LOCALE;
  return fmt(locale, {
    notation: "compact",
    maximumFractionDigits: options.maxDigits ?? 2,
  }).format(value);
}

/**
 * Percentage from a fraction (0.05 → "5.00%"). Always shows sign for
 * non-zero values when `signed` is true.
 */
export function formatPercent(
  fraction: number,
  options: FormatOptions & { readonly signed?: boolean } = {},
): string {
  if (!Number.isFinite(fraction)) return "—";
  const locale = options.locale ?? DEFAULT_LOCALE;
  const formatted = fmt(locale, {
    style: "percent",
    minimumFractionDigits: options.minDigits ?? 2,
    maximumFractionDigits: options.maxDigits ?? 2,
  }).format(fraction);
  if (options.signed && fraction > 0) return `+${formatted}`;
  return formatted;
}

/** Signed change in absolute units: +1.23 / -4.56. */
export function formatChange(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPrice(value, options)}`;
}

/** Clear the internal formatter cache (useful in tests). */
export function _clearFormatterCache(): void {
  cache.clear();
}
