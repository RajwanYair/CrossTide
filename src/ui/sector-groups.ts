/**
 * Sector grouping for the watchlist table.
 *
 * Groups watchlist entries under collapsible sector header rows.
 * Each sector header shows: name, count, and mini-consensus badge.
 *
 * Sector data is resolved from Yahoo Finance `sector` field (surfaced via
 * TickerData). Unknown/ETF/Crypto entries fall into special groups at the
 * bottom.
 *
 * Collapse state is persisted per-sector in localStorage.
 */
import type { WatchlistEntry, InstrumentType } from "../types/domain";

export interface SectorEntry {
  ticker: string;
  /** GICS sector name, e.g. "Technology", "Healthcare". */
  sector: string;
  instrumentType?: InstrumentType;
  /** Consensus direction for computing aggregate. */
  consensus?: "BUY" | "SELL" | "NEUTRAL";
}

export interface SectorGroup {
  name: string;
  entries: SectorEntry[];
  /** % of BUY signals across entries with a known consensus. */
  buyRatio: number;
}

const STORAGE_KEY_PREFIX = "ct_sector_collapsed_";
const ETF_GROUP = "— ETFs —";
const CRYPTO_GROUP = "— Crypto —";
const UNKNOWN_GROUP = "— Unknown —";

// ── Collapse state ─────────────────────────────────────────────────────────

export function isSectorCollapsed(sectorName: string): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + sectorName) === "1";
  } catch {
    return false;
  }
}

export function toggleSectorCollapsed(sectorName: string): boolean {
  const next = !isSectorCollapsed(sectorName);
  try {
    if (next) {
      localStorage.setItem(STORAGE_KEY_PREFIX + sectorName, "1");
    } else {
      localStorage.removeItem(STORAGE_KEY_PREFIX + sectorName);
    }
  } catch {
    // ignore
  }
  return next;
}

// ── Grouping logic ──────────────────────────────────────────────────────────

/**
 * Group watchlist entries by sector.
 * Equities with a known sector go into named sector groups (sorted alpha).
 * ETFs → ETF_GROUP, Crypto → CRYPTO_GROUP, unknown → UNKNOWN_GROUP.
 */
export function groupBySector(
  entries: readonly WatchlistEntry[],
  sectorMap: ReadonlyMap<string, string>, // ticker → sector name
  consensusMap?: ReadonlyMap<string, "BUY" | "SELL" | "NEUTRAL">,
): SectorGroup[] {
  const buckets = new Map<string, SectorEntry[]>();

  for (const entry of entries) {
    const type = entry.instrumentType;
    let bucketName: string;

    if (type === "etf") {
      bucketName = ETF_GROUP;
    } else if (type === "crypto") {
      bucketName = CRYPTO_GROUP;
    } else {
      const sector = sectorMap.get(entry.ticker);
      bucketName = sector ?? UNKNOWN_GROUP;
    }

    const sectorEntry: SectorEntry = {
      ticker: entry.ticker,
      sector: bucketName,
      ...(type !== undefined && { instrumentType: type }),
      ...(consensusMap?.has(entry.ticker) && {
        consensus: consensusMap.get(entry.ticker) as "BUY" | "SELL" | "NEUTRAL",
      }),
    };

    if (!buckets.has(bucketName)) buckets.set(bucketName, []);
    buckets.get(bucketName)!.push(sectorEntry);
  }

  // Build SectorGroup list: named sectors first (alpha), then special groups
  const namedSectors: SectorGroup[] = [];
  const specialGroups: SectorGroup[] = [];

  for (const [name, es] of buckets) {
    const buys = es.filter((e) => e.consensus === "BUY").length;
    const total = es.filter((e) => e.consensus !== undefined).length;
    const group: SectorGroup = {
      name,
      entries: es,
      buyRatio: total > 0 ? buys / total : 0,
    };

    if (name === ETF_GROUP || name === CRYPTO_GROUP || name === UNKNOWN_GROUP) {
      specialGroups.push(group);
    } else {
      namedSectors.push(group);
    }
  }

  namedSectors.sort((a, b) => a.name.localeCompare(b.name));
  specialGroups.sort((a, b) => a.name.localeCompare(b.name));

  return [...namedSectors, ...specialGroups];
}

// ── HTML rendering ──────────────────────────────────────────────────────────

function consensusBadge(ratio: number, total: number): string {
  if (total === 0) return "";
  const pct = Math.round(ratio * 100);
  const cls = ratio >= 0.6 ? "badge-buy" : ratio <= 0.4 ? "badge-sell" : "badge-neutral";
  return `<span class="badge ${cls} badge-sm">${pct}% BUY</span>`;
}

/**
 * Render sector header rows + data rows for a single group.
 * Returns an HTML string suitable for insertion into a <tbody>.
 */
export function renderSectorGroup(
  group: SectorGroup,
  renderRow: (ticker: string) => string,
): string {
  const collapsed = isSectorCollapsed(group.name);
  const total = group.entries.filter((e) => e.consensus !== undefined).length;
  const badge = consensusBadge(group.buyRatio, total);
  const chevron = collapsed ? "▶" : "▼";
  const collapseAttr = `data-sector="${encodeURIComponent(group.name)}"`;

  const headerRow = `<tr class="sector-header" ${collapseAttr} aria-expanded="${!collapsed}" tabindex="0" role="button">
    <td colspan="8">
      <span class="sector-chevron">${chevron}</span>
      <span class="sector-name">${group.name}</span>
      <span class="sector-count">(${group.entries.length})</span>
      ${badge}
    </td>
  </tr>`;

  if (collapsed) return headerRow;

  const dataRows = group.entries.map((e) => renderRow(e.ticker)).join("");
  return headerRow + dataRows;
}

/**
 * Attach click/keyboard handlers to sector header rows within a container.
 * Calls `onChange` with the updated collapse state after toggling.
 */
export function bindSectorHeaders(container: HTMLElement, onChange: () => void): void {
  container.addEventListener("click", (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-sector]");
    if (!row) return;
    const name = decodeURIComponent(row.dataset["sector"] ?? "");
    if (!name) return;
    toggleSectorCollapsed(name);
    onChange();
  });

  container.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-sector]");
    if (!row) return;
    e.preventDefault();
    const name = decodeURIComponent(row.dataset["sector"] ?? "");
    if (!name) return;
    toggleSectorCollapsed(name);
    onChange();
  });
}
