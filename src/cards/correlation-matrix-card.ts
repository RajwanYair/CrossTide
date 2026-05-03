/**
 * Correlation Matrix card — CardModule wrapper.
 *
 * G22: Wraps `domain/correlation-matrix.ts` in a full interactive card.
 * Renders an n×n color-coded Pearson-r heatmap for all watchlist tickers.
 * Highlights pairs with |r| > 0.85 as over-concentration warnings.
 *
 * Controls
 *   - Period selector: 20 / 60 / 120 trading days
 *   - Exclude-crypto toggle
 */
import { correlationMatrix, type CorrelationInput } from "../domain/correlation-matrix";
import { fetchTickerData } from "../core/data-service";
import { loadConfig } from "../core/config";
import { patchDOM } from "../core/patch-dom";
import { createDelegate } from "../ui/delegate";
import type { CardModule } from "./registry";
import type { InstrumentType } from "../types/domain";

// ── Types ─────────────────────────────────────────────────────────────────
export type CorrelationPeriod = 20 | 60 | 120;

interface TickerSeries {
  ticker: string;
  closes: readonly number[];
  instrumentType?: InstrumentType;
}

// ── Pure rendering helpers ─────────────────────────────────────────────────

/** Map correlation value [-1, 1] to a CSS hsl color string. */
export function correlationToColor(r: number): string {
  // Red = strong positive, Blue = strong negative, White/grey = near 0
  const clamped = Math.max(-1, Math.min(1, r));
  if (clamped >= 0) {
    // 0 → white(ish), 1 → vivid red
    const l = Math.round(95 - clamped * 45);
    return `hsl(0,${Math.round(clamped * 80)}%,${l}%)`;
  } else {
    // 0 → white(ish), -1 → vivid blue
    const abs = -clamped;
    const l = Math.round(95 - abs * 45);
    return `hsl(220,${Math.round(abs * 80)}%,${l}%)`;
  }
}

/** Escape minimal HTML special chars. */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Render the n×n grid as an HTML table. */
export function renderCorrelationTable(
  ids: readonly string[],
  matrix: readonly (readonly number[])[],
): string {
  const n = ids.length;
  if (n === 0) return `<p class="empty-state">No tickers to compare.</p>`;

  const header =
    `<th class="corr-cell corr-label"></th>` +
    ids.map((id) => `<th class="corr-cell corr-label">${esc(id)}</th>`).join("");

  const rows = ids
    .map((rowId, i) => {
      const cells = ids
        .map((_colId, j) => {
          const r = matrix[i]![j]!;
          const bg = correlationToColor(r);
          const bold = i === j ? " corr-diagonal" : "";
          const warn = i !== j && Math.abs(r) > 0.85 ? " corr-warn" : "";
          const display = i === j ? "—" : r.toFixed(2);
          return `<td class="corr-cell${bold}${warn}" style="background:${bg}" title="${esc(rowId)} / ${esc(ids[j]!)}: r = ${r.toFixed(4)}">${display}</td>`;
        })
        .join("");
      return `<tr><th class="corr-cell corr-label">${esc(rowId)}</th>${cells}</tr>`;
    })
    .join("");

  return `<div class="corr-scroll"><table class="corr-table" aria-label="Correlation matrix">
    <thead><tr>${header}</tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

/** List pairs with |r| > 0.85 (excluding diagonal). */
export function findOverConcentration(
  ids: readonly string[],
  matrix: readonly (readonly number[])[],
): Array<{ a: string; b: string; r: number }> {
  const results: Array<{ a: string; b: string; r: number }> = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const r = matrix[i]![j]!;
      if (Math.abs(r) > 0.85) {
        results.push({ a: ids[i]!, b: ids[j]!, r });
      }
    }
  }
  return results;
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderContent(
  container: HTMLElement,
  state: {
    period: CorrelationPeriod;
    excludeCrypto: boolean;
    series: readonly TickerSeries[] | null;
    loading: boolean;
    error: string | null;
  },
): void {
  const { period, excludeCrypto, series, loading, error } = state;

  const controls = `
    <div class="corr-controls">
      <label>
        Period:
        <select id="corr-period" data-action="change-period">
          <option value="20"${period === 20 ? " selected" : ""}>20 days</option>
          <option value="60"${period === 60 ? " selected" : ""}>60 days</option>
          <option value="120"${period === 120 ? " selected" : ""}>120 days</option>
        </select>
      </label>
      <label class="corr-toggle">
        <input type="checkbox" id="corr-exclude-crypto" data-action="toggle-crypto"${excludeCrypto ? " checked" : ""}> Exclude crypto
      </label>
    </div>`;

  let body: string;
  if (loading) {
    body = `<p class="empty-state">Loading…</p>`;
  } else if (error) {
    body = `<p class="empty-state corr-error">${esc(error)}</p>`;
  } else if (!series || series.length === 0) {
    body = `<p class="empty-state">Add tickers to your watchlist to see correlations.</p>`;
  } else {
    const filtered = excludeCrypto ? series.filter((s) => s.instrumentType !== "crypto") : series;

    if (filtered.length < 2) {
      body = `<p class="empty-state">Need at least 2 non-crypto tickers to compute correlations.</p>`;
    } else {
      const inputs: CorrelationInput[] = filtered.map((s) => ({
        id: s.ticker,
        values: s.closes.slice(-period),
      }));
      const { ids, matrix } = correlationMatrix(inputs);
      const warnings = findOverConcentration(ids, matrix);

      const warningHtml =
        warnings.length > 0
          ? `<div class="corr-warnings">
            <strong>⚠ Over-concentration (|r| > 0.85):</strong>
            <ul>${warnings.map((w) => `<li>${esc(w.a)} / ${esc(w.b)}: r = ${w.r.toFixed(3)}</li>`).join("")}</ul>
          </div>`
          : "";

      body = warningHtml + renderCorrelationTable(ids, matrix);
    }
  }

  const html = `
    <div class="card">
      <div class="card-header">
        <h2>Correlation Matrix</h2>
        <p class="card-subtitle text-secondary">Pearson r over last ${period} trading days</p>
      </div>
      <div class="card-body">
        ${controls}
        <div id="corr-body">${body}</div>
      </div>
    </div>`;

  patchDOM(container, html);
}

// ── Card module ─────────────────────────────────────────────────────────────

const correlationMatrixCard: CardModule = {
  mount(container) {
    let period: CorrelationPeriod = 60;
    let excludeCrypto = false;
    let series: TickerSeries[] | null = null;
    let abortController: AbortController | null = null;

    function rerender(): void {
      renderContent(container, { period, excludeCrypto, series, loading: false, error: null });
    }

    // Event delegation: single listener handles period and crypto toggle changes
    const delegate = createDelegate(
      container,
      {
        "change-period": (el) => {
          period = Number((el as HTMLSelectElement).value) as CorrelationPeriod;
          rerender();
        },
        "toggle-crypto": (el) => {
          excludeCrypto = (el as HTMLInputElement).checked;
          rerender();
        },
      },
      { eventTypes: ["change"] },
    );

    async function load(): Promise<void> {
      abortController?.abort();
      const ac = new AbortController();
      abortController = ac;

      renderContent(container, { period, excludeCrypto, series: null, loading: true, error: null });

      const config = loadConfig();
      const tickers = config.watchlist.map((e) => e.ticker);

      if (tickers.length === 0) {
        series = [];
        rerender();
        return;
      }

      try {
        const results = await Promise.allSettled(tickers.map((t) => fetchTickerData(t, ac.signal)));

        const loaded: TickerSeries[] = [];
        for (const result of results) {
          if (result.status === "fulfilled" && !result.value.error) {
            const { ticker, candles, instrumentType } = result.value;
            const entry: TickerSeries = {
              ticker,
              closes: candles.map((c) => c.close),
            };
            if (instrumentType !== undefined) entry.instrumentType = instrumentType;
            loaded.push(entry);
          }
        }
        if (!ac.signal.aborted) {
          series = loaded;
          rerender();
        }
      } catch {
        if (!ac.signal.aborted) {
          renderContent(container, {
            period,
            excludeCrypto,
            series: null,
            loading: false,
            error: "Failed to load data.",
          });
        }
      }
    }

    void load();

    return {
      dispose(): void {
        abortController?.abort();
        delegate.dispose();
      },
    };
  },
};

export default correlationMatrixCard;
