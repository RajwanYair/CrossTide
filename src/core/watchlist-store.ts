/**
 * Watchlist Store — manages watchlist state with signal store pattern.
 *
 * P6: Replaces scattered state management in main.ts with a structured store.
 */

import { createPersistedStore } from "./store";
import type { InstrumentType } from "../types/domain";

export interface WatchlistState {
  tickers: string[];
  names: Record<string, string>;
  instrumentTypes: Record<string, InstrumentType>;
  activeWatchlistId: string;
  sortColumn: string;
  sortDirection: "asc" | "desc";
}

const INITIAL: WatchlistState = {
  tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"],
  names: {},
  instrumentTypes: {},
  activeWatchlistId: "default",
  sortColumn: "ticker",
  sortDirection: "asc",
};

export const watchlistStore = createPersistedStore<
  WatchlistState,
  {
    addTicker: (ticker: string) => void;
    removeTicker: (ticker: string) => void;
    reorder: (tickers: string[]) => void;
    setSort: (column: string, direction?: "asc" | "desc") => void;
    setNames: (names: Record<string, string>) => void;
    setInstrumentTypes: (types: Record<string, InstrumentType>) => void;
  }
>("ct:watchlist", INITIAL, (get, set) => ({
  addTicker: (ticker: string): void => {
    const current = get().tickers;
    if (!current.includes(ticker)) {
      set({ tickers: [...current, ticker] });
    }
  },
  removeTicker: (ticker: string): void => {
    set({ tickers: get().tickers.filter((t) => t !== ticker) });
  },
  reorder: (tickers: string[]): void => {
    set({ tickers });
  },
  setSort: (column: string, direction?: "asc" | "desc"): void => {
    const current = get();
    const dir =
      direction ??
      (current.sortColumn === column && current.sortDirection === "asc" ? "desc" : "asc");
    set({ sortColumn: column, sortDirection: dir });
  },
  setNames: (names: Record<string, string>): void => {
    set({ names: { ...get().names, ...names } });
  },
  setInstrumentTypes: (types: Record<string, InstrumentType>): void => {
    set({ instrumentTypes: { ...get().instrumentTypes, ...types } });
  },
}));
