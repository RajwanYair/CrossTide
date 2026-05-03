/**
 * Market-hours detection for WebSocket connection gating (R24).
 *
 * Determines whether major stock exchanges are currently in trading
 * hours to gate live WS connections (avoiding unnecessary connections
 * and data costs outside trading hours).
 *
 * Supports: NYSE/NASDAQ, LSE, TSE (Tokyo), HKEX, Euronext.
 *
 * Usage:
 *   if (isMarketOpen("NYSE")) connectLiveWs();
 *   const next = nextOpen("NYSE");
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface MarketSchedule {
  readonly exchange: ExchangeCode;
  readonly name: string;
  /** IANA timezone identifier. */
  readonly timezone: string;
  /** Open time in HH:MM (local). */
  readonly openTime: string;
  /** Close time in HH:MM (local). */
  readonly closeTime: string;
  /** Trading days (0=Sun, 1=Mon, ..., 6=Sat). */
  readonly tradingDays: readonly number[];
}

export type ExchangeCode = "NYSE" | "NASDAQ" | "LSE" | "TSE" | "HKEX" | "EURONEXT";

export interface MarketStatus {
  readonly exchange: ExchangeCode;
  readonly isOpen: boolean;
  readonly currentLocalTime: string;
  readonly openTime: string;
  readonly closeTime: string;
  readonly nextOpenAt: Date | null;
  readonly nextCloseAt: Date | null;
}

// ── Schedules ────────────────────────────────────────────────────────────

const WEEKDAYS = [1, 2, 3, 4, 5] as const;

export const SCHEDULES: Record<ExchangeCode, MarketSchedule> = {
  NYSE: {
    exchange: "NYSE",
    name: "New York Stock Exchange",
    timezone: "America/New_York",
    openTime: "09:30",
    closeTime: "16:00",
    tradingDays: WEEKDAYS,
  },
  NASDAQ: {
    exchange: "NASDAQ",
    name: "NASDAQ",
    timezone: "America/New_York",
    openTime: "09:30",
    closeTime: "16:00",
    tradingDays: WEEKDAYS,
  },
  LSE: {
    exchange: "LSE",
    name: "London Stock Exchange",
    timezone: "Europe/London",
    openTime: "08:00",
    closeTime: "16:30",
    tradingDays: WEEKDAYS,
  },
  TSE: {
    exchange: "TSE",
    name: "Tokyo Stock Exchange",
    timezone: "Asia/Tokyo",
    openTime: "09:00",
    closeTime: "15:00",
    tradingDays: WEEKDAYS,
  },
  HKEX: {
    exchange: "HKEX",
    name: "Hong Kong Stock Exchange",
    timezone: "Asia/Hong_Kong",
    openTime: "09:30",
    closeTime: "16:00",
    tradingDays: WEEKDAYS,
  },
  EURONEXT: {
    exchange: "EURONEXT",
    name: "Euronext (Paris/Amsterdam)",
    timezone: "Europe/Paris",
    openTime: "09:00",
    closeTime: "17:30",
    tradingDays: WEEKDAYS,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────

function parseHHMM(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { hours: h!, minutes: m! };
}

function getLocalParts(
  date: Date,
  timezone: string,
): { dayOfWeek: number; hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "";
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] ?? 0;
  const hours = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minutes = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  return { dayOfWeek, hours, minutes };
}

function localTimeString(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

// ── Core API ─────────────────────────────────────────────────────────────

/**
 * Check if a specific exchange is currently open.
 */
export function isMarketOpen(exchange: ExchangeCode, now?: Date): boolean {
  const schedule = SCHEDULES[exchange];
  const date = now ?? new Date();
  const { dayOfWeek, hours, minutes } = getLocalParts(date, schedule.timezone);

  if (!schedule.tradingDays.includes(dayOfWeek)) return false;

  const currentMin = timeToMinutes(hours, minutes);
  const open = parseHHMM(schedule.openTime);
  const close = parseHHMM(schedule.closeTime);
  const openMin = timeToMinutes(open.hours, open.minutes);
  const closeMin = timeToMinutes(close.hours, close.minutes);

  return currentMin >= openMin && currentMin < closeMin;
}

/**
 * Get detailed market status for an exchange.
 */
export function marketStatus(exchange: ExchangeCode, now?: Date): MarketStatus {
  const schedule = SCHEDULES[exchange];
  const date = now ?? new Date();
  const { hours, minutes } = getLocalParts(date, schedule.timezone);
  const isOpen = isMarketOpen(exchange, date);

  return {
    exchange,
    isOpen,
    currentLocalTime: localTimeString(hours, minutes),
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
    nextOpenAt: isOpen ? null : estimateNextOpen(schedule, date),
    nextCloseAt: isOpen ? estimateNextClose(schedule, date) : null,
  };
}

/**
 * Get all exchanges and their open/closed status.
 */
export function allMarketStatuses(now?: Date): MarketStatus[] {
  const date = now ?? new Date();
  return (Object.keys(SCHEDULES) as ExchangeCode[]).map((ex) => marketStatus(ex, date));
}

/**
 * Check if ANY market is currently open.
 */
export function isAnyMarketOpen(now?: Date): boolean {
  const date = now ?? new Date();
  return (Object.keys(SCHEDULES) as ExchangeCode[]).some((ex) => isMarketOpen(ex, date));
}

/**
 * Get list of currently open exchanges.
 */
export function openExchanges(now?: Date): ExchangeCode[] {
  const date = now ?? new Date();
  return (Object.keys(SCHEDULES) as ExchangeCode[]).filter((ex) => isMarketOpen(ex, date));
}

// ── Next open/close estimation ───────────────────────────────────────────

function estimateNextOpen(schedule: MarketSchedule, from: Date): Date {
  const open = parseHHMM(schedule.openTime);
  // Try each of the next 7 days
  for (let d = 0; d < 7; d++) {
    const candidate = new Date(from.getTime() + d * 86400_000);
    const { dayOfWeek, hours, minutes } = getLocalParts(candidate, schedule.timezone);

    if (!schedule.tradingDays.includes(dayOfWeek)) continue;

    const currentMin = timeToMinutes(hours, minutes);
    const openMin = timeToMinutes(open.hours, open.minutes);

    if (d === 0 && currentMin >= openMin) continue; // Already past open today

    // Estimate: return approximate time
    const diffMin = d === 0 ? openMin - currentMin : openMin + (d * 1440 - currentMin);
    return new Date(from.getTime() + diffMin * 60_000);
  }
  return new Date(from.getTime() + 7 * 86400_000);
}

function estimateNextClose(schedule: MarketSchedule, from: Date): Date {
  const close = parseHHMM(schedule.closeTime);
  const { hours, minutes } = getLocalParts(from, schedule.timezone);
  const currentMin = timeToMinutes(hours, minutes);
  const closeMin = timeToMinutes(close.hours, close.minutes);
  const diffMin = closeMin - currentMin;
  return new Date(from.getTime() + diffMin * 60_000);
}

/**
 * Determine whether to gate (block) a WS connection based on market hours.
 * Returns true if connection should be allowed.
 */
export function shouldConnectWs(exchanges: readonly ExchangeCode[], now?: Date): boolean {
  const date = now ?? new Date();
  return exchanges.some((ex) => isMarketOpen(ex, date));
}
