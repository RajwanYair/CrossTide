/**
 * Branded (nominal) types for primitives that need stronger typing
 * than plain `string` / `number`.
 *
 * Brands are erased at runtime — the smart constructors validate input
 * and return a typed alias. There is no runtime cost beyond the validation
 * that already happens at boundaries.
 */

declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

/** Uppercase 1-10 char ticker symbol. */
export type Ticker = Brand<string, "Ticker">;

/** ISO 8601 date string (YYYY-MM-DD). */
export type IsoDate = Brand<string, "IsoDate">;

/** ISO 8601 timestamp (full datetime). */
export type IsoTimestamp = Brand<string, "IsoTimestamp">;

/** UUIDv4 string. */
export type Uuid = Brand<string, "Uuid">;

/** Non-negative integer. */
export type NonNegativeInt = Brand<number, "NonNegativeInt">;

/** Non-negative finite number (e.g. price, volume). */
export type NonNegativeNumber = Brand<number, "NonNegativeNumber">;

/** A finite number in 0..1. */
export type UnitInterval = Brand<number, "UnitInterval">;

/** A finite percent value (no implicit range). */
export type Percent = Brand<number, "Percent">;

// --- smart constructors -----------------------------------------------------

const TICKER_RE = /^[A-Z][A-Z0-9.-]{0,9}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BrandError extends Error {
  constructor(
    public readonly brandName: string,
    public readonly value: unknown,
  ) {
    super(`Invalid ${brandName}: ${JSON.stringify(value)}`);
    this.name = "BrandError";
  }
}

export function ticker(value: string): Ticker {
  const s = value.trim().toUpperCase();
  if (!TICKER_RE.test(s)) throw new BrandError("Ticker", value);
  return s as Ticker;
}

export function tryTicker(value: string): Ticker | null {
  try {
    return ticker(value);
  } catch {
    return null;
  }
}

export function isoDate(value: string): IsoDate {
  if (!ISO_DATE_RE.test(value)) throw new BrandError("IsoDate", value);
  // Validate calendar correctness (e.g. 2025-02-30 fails Date parsing here).
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    throw new BrandError("IsoDate", value);
  }
  return value as IsoDate;
}

export function isoTimestamp(value: string): IsoTimestamp {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BrandError("IsoTimestamp", value);
  return value as IsoTimestamp;
}

export function uuid(value: string): Uuid {
  if (!UUID_RE.test(value)) throw new BrandError("Uuid", value);
  return value as Uuid;
}

export function nonNegativeInt(value: number): NonNegativeInt {
  if (!Number.isInteger(value) || value < 0) throw new BrandError("NonNegativeInt", value);
  return value as NonNegativeInt;
}

export function nonNegativeNumber(value: number): NonNegativeNumber {
  if (!Number.isFinite(value) || value < 0) throw new BrandError("NonNegativeNumber", value);
  return value as NonNegativeNumber;
}

export function unitInterval(value: number): UnitInterval {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new BrandError("UnitInterval", value);
  return value as UnitInterval;
}

export function percent(value: number): Percent {
  if (!Number.isFinite(value)) throw new BrandError("Percent", value);
  return value as Percent;
}

/** Type-only assertion helpers — throw on failure. */
export const Brands = {
  ticker,
  tryTicker,
  isoDate,
  isoTimestamp,
  uuid,
  nonNegativeInt,
  nonNegativeNumber,
  unitInterval,
  percent,
} as const;
