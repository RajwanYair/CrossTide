/**
 * Portfolio Store — manages portfolio positions with signal store pattern.
 *
 * P7: Provides structured, persisted state for portfolio holdings,
 * complementing the watchlist store with position-level tracking.
 */

import { createPersistedStore } from "./store";

export interface PortfolioPosition {
  readonly ticker: string;
  /** Average cost basis per share. */
  readonly costBasis: number;
  /** Number of shares held (fractional allowed). */
  readonly shares: number;
  /** ISO date of initial purchase, e.g. "2024-01-15". */
  readonly openDate: string;
}

export interface PortfolioState {
  readonly positions: PortfolioPosition[];
  /** ISO 4217 currency code, e.g. "USD". */
  readonly currency: string;
  readonly name: string;
}

const INITIAL: PortfolioState = {
  positions: [],
  currency: "USD",
  name: "My Portfolio",
};

export const portfolioStore = createPersistedStore<
  PortfolioState,
  {
    addPosition: (position: PortfolioPosition) => void;
    removePosition: (ticker: string) => void;
    updatePosition: (ticker: string, patch: Partial<Omit<PortfolioPosition, "ticker">>) => void;
    setCurrency: (currency: string) => void;
    setName: (name: string) => void;
  }
>("ct:portfolio", INITIAL, (get, set) => ({
  addPosition: (position: PortfolioPosition): void => {
    const current = get().positions;
    const exists = current.findIndex((p) => p.ticker === position.ticker);
    if (exists >= 0) {
      // Merge into existing position using weighted average cost basis
      const existing = current[exists]!;
      const totalShares = existing.shares + position.shares;
      const avgCost =
        (existing.costBasis * existing.shares + position.costBasis * position.shares) / totalShares;
      const updated: PortfolioPosition = {
        ...existing,
        shares: totalShares,
        costBasis: avgCost,
      };
      set({ positions: current.map((p, i) => (i === exists ? updated : p)) });
    } else {
      set({ positions: [...current, position] });
    }
  },
  removePosition: (ticker: string): void => {
    set({ positions: get().positions.filter((p) => p.ticker !== ticker) });
  },
  updatePosition: (ticker: string, patch: Partial<Omit<PortfolioPosition, "ticker">>): void => {
    set({
      positions: get().positions.map((p) => (p.ticker === ticker ? { ...p, ...patch } : p)),
    });
  },
  setCurrency: (currency: string): void => {
    set({ currency });
  },
  setName: (name: string): void => {
    set({ name });
  },
}));
