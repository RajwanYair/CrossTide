/**
 * Instrument-type filter chips — All / Stocks / ETFs / Crypto / Other.
 *
 * Renders a chip bar above the watchlist table. The active filter is persisted
 * in localStorage so the user's choice survives page refresh.
 */
import type { InstrumentType, WatchlistEntry } from "../types/domain";

export type InstrumentFilter = "all" | InstrumentType;

const STORAGE_KEY = "ct_instrument_filter";
const CHIP_BAR_ID = "instrument-filter-bar";

const CHIPS: { label: string; value: InstrumentFilter }[] = [
  { label: "All", value: "all" },
  { label: "Stocks", value: "stock" },
  { label: "ETFs", value: "etf" },
  { label: "Crypto", value: "crypto" },
  { label: "Other", value: "other" },
];

let activeFilter: InstrumentFilter = "all";

/** Load persisted filter on startup. */
export function loadInstrumentFilter(): InstrumentFilter {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "all" || saved === "stock" || saved === "etf" || saved === "crypto" || saved === "other") {
      activeFilter = saved;
    }
  } catch {
    // localStorage unavailable
  }
  return activeFilter;
}

/** Get current active filter. */
export function getInstrumentFilter(): InstrumentFilter {
  return activeFilter;
}

/** Set the active filter and persist it. */
export function setInstrumentFilter(filter: InstrumentFilter, onChange?: () => void): void {
  activeFilter = filter;
  try {
    localStorage.setItem(STORAGE_KEY, filter);
  } catch {
    // ignore
  }
  renderChipBar();
  onChange?.();
}

/**
 * Apply the active filter to a list of watchlist entries.
 * Entries without an `instrumentType` are shown for all filters except
 * specific type filters (where they are shown only under "all").
 */
export function applyInstrumentFilter(
  entries: readonly WatchlistEntry[],
  filter: InstrumentFilter = activeFilter,
): WatchlistEntry[] {
  if (filter === "all") return [...entries];
  return entries.filter((e) => {
    const t = e.instrumentType ?? "other";
    return t === filter;
  });
}

/**
 * Map an instrument type to a small CSS badge class.
 */
export function instrumentTypeBadge(type: InstrumentType | undefined): string {
  if (!type) return "";
  const label = type === "stock" ? "S" : type === "etf" ? "E" : type === "crypto" ? "C" : "?";
  return `<span class="instrument-badge instrument-badge-${type}" title="${type}">${label}</span>`;
}

/** Render the chip bar into the container. */
export function renderChipBar(onChange?: () => void): void {
  const bar = document.getElementById(CHIP_BAR_ID);
  if (!bar) return;

  bar.innerHTML = CHIPS.map(
    ({ label, value }) =>
      `<button class="filter-chip${value === activeFilter ? " active" : ""}" data-filter="${value}">${label}</button>`,
  ).join("");

  bar.querySelectorAll<HTMLButtonElement>(".filter-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      setInstrumentFilter(btn.dataset["filter"] as InstrumentFilter, onChange);
    });
  });
}

/** Mount the chip bar into an existing DOM container and attach click handlers. */
export function mountInstrumentFilterBar(onChange: () => void): void {
  loadInstrumentFilter();
  renderChipBar(onChange);
}
