/**
 * Consensus Timeline card — visualises consensus direction history for
 * up to 5 tickers using the existing renderConsensusTimeline utility.
 *
 * Generates deterministic synthetic snapshot histories so the card is
 * immediately useful without a live data connection.
 */
import { renderConsensusTimeline, type ConsensusSnapshot } from "./consensus-timeline";
import { patchDOM } from "../core/patch-dom";
import { createDelegate, type DelegateHandle } from "../ui/delegate";
import type { CardModule, CardContext } from "./registry";
import type { SignalDirection } from "../types/domain";

// ── Synthetic history generator ───────────────────────────────────────────────
const DIRECTIONS: SignalDirection[] = ["BUY", "NEUTRAL", "SELL"];

function syntheticHistory(ticker: string, days = 60): ConsensusSnapshot[] {
  // Use ticker char codes as seed for reproducibility
  const seed = ticker.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  let state = seed;
  const rng = (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0x100000000;
  };

  const snapshots: ConsensusSnapshot[] = [];
  const dirIdx = [1, 0, 1, 2, 1, 0][seed % 6] ?? 1; // deterministic start direction index
  let dir: SignalDirection = DIRECTIONS[dirIdx] ?? "NEUTRAL";

  const start = new Date(Date.now() - days * 86400_000);

  for (let i = 0; i < days; i++) {
    // 15% daily chance of direction change
    if (rng() < 0.15) {
      const choices = DIRECTIONS.filter((d) => d !== dir);
      dir = choices[Math.floor(rng() * choices.length)] ?? dir;
    }
    const d = new Date(start.getTime() + i * 86400_000);
    snapshots.push({
      ticker,
      direction: dir,
      strength: 0.4 + rng() * 0.6,
      timestamp: d.toISOString().slice(0, 10),
    });
  }
  return snapshots;
}

// ── Demo tickers ──────────────────────────────────────────────────────────────
const DEMO_TICKERS = ["AAPL", "MSFT", "NVDA", "JPM", "XOM"];

// ── Render ────────────────────────────────────────────────────────────────────
function renderTimelineCard(container: HTMLElement, initialTicker?: string): DelegateHandle {
  // If a ticker was selected, ensure it's in the demo list
  const tickers =
    initialTicker && !DEMO_TICKERS.includes(initialTicker)
      ? [initialTicker, ...DEMO_TICKERS]
      : DEMO_TICKERS;
  const defaultTicker = initialTicker || tickers[0]!;

  patchDOM(
    container,
    `
    <div class="timeline-card-layout">
      <div class="timeline-controls">
        <label class="backtest-label" for="tl-ticker">Ticker</label>
        <select id="tl-ticker" class="input" data-action="change-ticker">
          ${tickers.map((t) => `<option value="${t}"${t === defaultTicker ? " selected" : ""}>${t}</option>`).join("")}
        </select>
        <label class="backtest-label" for="tl-days">History (days)</label>
        <select id="tl-days" class="input" data-action="change-days">
          <option value="30">30</option>
          <option value="60" selected>60</option>
          <option value="90">90</option>
          <option value="180">180</option>
        </select>
      </div>
      <div id="timeline-single-view"></div>
      <hr class="timeline-divider" />
      <h3 class="section-subtitle">All Demo Tickers — 60-Day Snapshot</h3>
      <div id="timeline-multi-view"></div>
    </div>`,
  );

  const singleView = container.querySelector<HTMLElement>("#timeline-single-view")!;
  const multiView = container.querySelector<HTMLElement>("#timeline-multi-view")!;

  const renderSingle = (): void => {
    const tickerSel = container.querySelector<HTMLSelectElement>("#tl-ticker");
    const daysSel = container.querySelector<HTMLSelectElement>("#tl-days");
    const ticker = tickerSel?.value ?? defaultTicker;
    const days = parseInt(daysSel?.value ?? "60", 10) || 60;
    renderConsensusTimeline(singleView, ticker, syntheticHistory(ticker, days));
  };

  const renderMulti = (): void => {
    multiView.textContent = "";
    for (const t of DEMO_TICKERS) {
      const wrap = document.createElement("div");
      wrap.className = "timeline-multi-item";
      renderConsensusTimeline(wrap, t, syntheticHistory(t, 60));
      multiView.appendChild(wrap);
    }
  };

  renderSingle();
  renderMulti();

  return createDelegate(
    container,
    {
      "change-ticker": () => renderSingle(),
      "change-days": () => renderSingle(),
    },
    { eventTypes: ["change"] },
  );
}

const consensusTimelineCard: CardModule = {
  mount(container, ctx) {
    const ticker = ctx.params["symbol"] ?? "";
    let delegateHandle = renderTimelineCard(container, ticker || undefined);
    return {
      update(newCtx: CardContext): void {
        const t = newCtx.params["symbol"] ?? "";
        delegateHandle.dispose();
        delegateHandle = renderTimelineCard(container, t || undefined);
      },
      dispose(): void {
        delegateHandle.dispose();
      },
    };
  },
};

export default consensusTimelineCard;
