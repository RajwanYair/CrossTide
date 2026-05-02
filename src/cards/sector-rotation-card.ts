/**
 * Sector Rotation card (H20).
 *
 * Shows relative strength of sector ETFs versus SPY across multiple windows.
 */
import { fetchAllTickers } from "../core/data-service";
import { getNavigationSignal } from "../ui/router";
import type { DailyCandle } from "../types/domain";
import type { CardModule } from "./registry";

const SECTOR_ETFS = [
  "XLC", "XLY", "XLP", "XLE", "XLF", "XLV", "XLI", "XLB", "XLRE", "XLK", "XLU",
] as const;

const WINDOWS: Array<{ key: string; label: string; days: number }> = [
  { key: "1w", label: "1W", days: 5 },
  { key: "1m", label: "1M", days: 21 },
  { key: "3m", label: "3M", days: 63 },
  { key: "6m", label: "6M", days: 126 },
  { key: "1y", label: "1Y", days: 252 },
];

export function computeReturn(candles: readonly DailyCandle[], days: number): number {
  if (candles.length < days + 1) return 0;
  const end = candles[candles.length - 1]!.close;
  const start = candles[candles.length - 1 - days]!.close;
  if (!Number.isFinite(start) || start === 0) return 0;
  return (end - start) / start;
}

export function classifyRelativeStrength(value: number): "outperform" | "underperform" | "flat" {
  if (value > 0.0025) return "outperform";
  if (value < -0.0025) return "underperform";
  return "flat";
}

function fmtPct(v: number): string {
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}%`;
}

export function renderSectorRotation(
  container: HTMLElement,
  matrix: Readonly<Record<string, Readonly<Record<string, number>>>>,
): void {
  const head = WINDOWS.map((w) => `<th>${w.label}</th>`).join("");
  const rows = SECTOR_ETFS.map((etf) => {
    const cols = WINDOWS.map((w) => {
      const v = matrix[etf]?.[w.key] ?? 0;
      const cls = classifyRelativeStrength(v);
      return `<td class="rot-cell rot-${cls}">${fmtPct(v)}</td>`;
    }).join("");
    return `<tr><th class="font-mono">${etf}</th>${cols}</tr>`;
  }).join("");

  container.innerHTML = `<div class="card">
    <div class="card-header"><h2>Sector Rotation</h2></div>
    <div class="card-body">
      <table class="rotation-table">
        <thead><tr><th>Sector ETF</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

const sectorRotationCard: CardModule = {
  mount(container) {
    let disposed = false;

    async function load(): Promise<void> {
      const tickers = [...SECTOR_ETFS, "SPY"];
      const data = await fetchAllTickers(tickers, undefined, getNavigationSignal());
      if (disposed) return;

      const spy = data.get("SPY")?.candles ?? [];
      const matrix: Record<string, Record<string, number>> = {};

      for (const etf of SECTOR_ETFS) {
        const c = data.get(etf)?.candles ?? [];
        matrix[etf] = {};
        for (const w of WINDOWS) {
          const rel = computeReturn(c, w.days) - computeReturn(spy, w.days);
          matrix[etf][w.key] = rel;
        }
      }

      renderSectorRotation(container, matrix);
    }

    container.innerHTML = `<div class="card"><div class="card-body"><p class="empty-state">Loading sector rotation…</p></div></div>`;
    void load();

    return {
      dispose(): void {
        disposed = true;
      },
    };
  },
};

export default sectorRotationCard;
