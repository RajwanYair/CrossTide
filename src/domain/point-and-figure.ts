/**
 * Point & Figure (P&F) chart computation.
 *
 * R8: Converts a price series into Point & Figure columns of X's (up) and
 * O's (down). Each box represents `boxSize` price units. A column reversal
 * occurs when price moves `reversal × boxSize` in the opposite direction.
 *
 * Traditional method: uses closing prices. High/Low method: uses intraday H/L.
 * This implementation uses the traditional closing-price method by default,
 * with opt-in H/L method.
 *
 * Reference: Chartcraft & Dorsey, Wright & Associates methodology.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** A single P&F box (one X or one O). */
export interface PnfBox {
  /** Price level of this box (bottom edge = price, top edge = price + boxSize). */
  readonly price: number;
  /** X = up, O = down. */
  readonly type: "X" | "O";
}

/** A column of consecutive X's or O's. */
export interface PnfColumn {
  /** All boxes in this column, sorted by price descending for X, ascending for O. */
  readonly boxes: readonly PnfBox[];
  /** Direction of this column. */
  readonly direction: "X" | "O";
  /** Price of the lowest box in the column. */
  readonly low: number;
  /** Price of the highest box in the column. */
  readonly high: number;
  /** Number of boxes in this column. */
  readonly count: number;
}

/** Full P&F chart output. */
export interface PnfChart {
  /** Ordered columns (first = oldest). */
  readonly columns: readonly PnfColumn[];
  /** Box size used for the computation. */
  readonly boxSize: number;
  /** Reversal count used (default 3). */
  readonly reversal: number;
}

/** Input options for `computePnf()`. */
export interface PnfOptions {
  /**
   * Fixed box size in price units.
   * Default: ATR-based auto-sizing (1% of starting price, rounded to nearest 0.5).
   */
  boxSize?: number;
  /**
   * Number of boxes required for a reversal to start a new column.
   * @default 3
   */
  reversal?: number;
  /**
   * Use High/Low method (intraday H/L) instead of closing-price method.
   * Requires input to provide `high` and `low` fields.
   * @default false
   */
  useHighLow?: boolean;
}

/** Input data point for P&F computation. */
export interface PnfInput {
  readonly close: number;
  readonly high?: number;
  readonly low?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Round a price down to the nearest box bottom using the given box size.
 * e.g. price=23.7, boxSize=1 → 23; price=23.7, boxSize=0.5 → 23.5
 */
export function floorBox(price: number, boxSize: number): number {
  return Math.floor(price / boxSize) * boxSize;
}

/**
 * Auto-calculate a reasonable box size from the price series.
 * Uses 1% of the median price, snapped to a "nice" number (0.05, 0.1, 0.5, 1, 5, 10, 50, 100).
 */
export function autoBoxSize(prices: readonly number[]): number {
  if (prices.length === 0) return 1;
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const raw = median * 0.01;
  const nice = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];
  let best = nice[0]!;
  for (const n of nice) {
    if (n <= raw) best = n;
    else break;
  }
  return best;
}

// ── Core algorithm ────────────────────────────────────────────────────────────

/**
 * Compute a Point & Figure chart from a price series.
 *
 * @param data    - Ordered price inputs (oldest first).
 * @param options - Box size, reversal count, and method options.
 * @returns A `PnfChart` with ordered columns of X/O boxes.
 */
export function computePnf(data: readonly PnfInput[], options: PnfOptions = {}): PnfChart {
  const reversal = Math.max(1, options.reversal ?? 3);

  if (data.length === 0) {
    return { columns: [], boxSize: options.boxSize ?? 1, reversal };
  }

  const closePrices = data.map((d) => d.close);
  const boxSize = options.boxSize ?? autoBoxSize(closePrices);

  const columns: PnfColumn[] = [];

  // ── Seed from the first price ────────────────────────────────────────
  const firstClose = data[0]!.close;
  const currentBox = floorBox(firstClose, boxSize);
  let direction: "X" | "O" = "X";
  let colBoxes: number[] = [currentBox]; // accumulate box levels
  // Track the extremes of the current column for reversal logic
  let colHigh = currentBox; // highest box start in current column
  let colLow = currentBox; // lowest box start in current column

  function finishColumn(): void {
    if (colBoxes.length === 0) return;
    const min = Math.min(...colBoxes);
    const max = Math.max(...colBoxes);
    const boxes: PnfBox[] = colBoxes.map((b) => ({ price: b, type: direction }));
    columns.push({ boxes, direction, low: min, high: max + boxSize, count: boxes.length });
    colBoxes = [];
  }

  // ── Process remaining prices ─────────────────────────────────────────
  for (let i = 1; i < data.length; i++) {
    const point = data[i]!;
    const upPrice = options.useHighLow ? (point.high ?? point.close) : point.close;
    const downPrice = options.useHighLow ? (point.low ?? point.close) : point.close;

    if (direction === "X") {
      // Can we add more X's?
      const newHigh = floorBox(upPrice, boxSize);
      if (newHigh >= colHigh + boxSize) {
        let next = colHigh + boxSize;
        while (next <= newHigh) {
          colBoxes.push(next);
          colHigh = next;
          next += boxSize;
        }
      }
      // Can we reverse to a new O column?
      const reversalTarget = colHigh - reversal * boxSize;
      const newLow = floorBox(downPrice, boxSize);
      if (newLow <= reversalTarget) {
        const prevHigh = colHigh; // save before clearing
        finishColumn();
        direction = "O";
        // O column starts one box below the previous X high
        colHigh = prevHigh - boxSize;
        colLow = colHigh;
        let next = colHigh;
        while (next >= newLow) {
          colBoxes.push(next);
          colLow = next;
          next -= boxSize;
        }
      }
    } else {
      // direction === "O"
      // Can we add more O's?
      const newLow = floorBox(downPrice, boxSize);
      if (newLow <= colLow - boxSize) {
        let next = colLow - boxSize;
        while (next >= newLow) {
          colBoxes.push(next);
          colLow = next;
          next -= boxSize;
        }
      }
      // Can we reverse to a new X column?
      const reversalTarget = colLow + reversal * boxSize;
      const newHigh = floorBox(upPrice, boxSize);
      if (newHigh >= reversalTarget) {
        const prevLow = colLow; // save before clearing
        finishColumn();
        direction = "X";
        // X column starts one box above the previous O low
        colLow = prevLow + boxSize;
        colHigh = colLow;
        let next = colLow;
        while (next <= newHigh) {
          colBoxes.push(next);
          colHigh = next;
          next += boxSize;
        }
      }
    }
  }

  // Flush the current in-progress column
  if (colBoxes.length > 0) {
    finishColumn();
  }

  return { columns, boxSize, reversal };
}
