/**
 * English (en) locale — base translation dictionary.
 * All UI-visible strings are defined here as the source of truth.
 */
import { registerLocale } from "../core/i18n-catalog";

const en = {
  // ── Navigation ──
  "nav.watchlist": "Watchlist",
  "nav.chart": "Chart",
  "nav.screener": "Screener",
  "nav.alerts": "Alerts",
  "nav.portfolio": "Portfolio",
  "nav.backtest": "Backtest",
  "nav.consensus": "Consensus",
  "nav.heatmap": "Heatmap",
  "nav.settings": "Settings",

  // ── Common actions ──
  "action.add": "Add",
  "action.remove": "Remove",
  "action.save": "Save",
  "action.cancel": "Cancel",
  "action.export": "Export",
  "action.import": "Import",
  "action.clear": "Clear All",
  "action.refresh": "Refresh",
  "action.search": "Search",
  "action.close": "Close",
  "action.confirm": "Confirm",
  "action.delete": "Delete",

  // ── Watchlist ──
  "watchlist.title": "Watchlist",
  "watchlist.addTicker": "Add ticker symbol…",
  "watchlist.empty": "No tickers added yet. Type a symbol above to get started.",
  "watchlist.price": "Price",
  "watchlist.change": "Change",
  "watchlist.volume": "Volume",
  "watchlist.marketCap": "Market Cap",

  // ── Chart ──
  "chart.title": "Chart",
  "chart.timeframe": "Timeframe",
  "chart.indicators": "Indicators",
  "chart.drawingTools": "Drawing Tools",
  "chart.fullscreen": "Full Screen",

  // ── Consensus ──
  "consensus.title": "Consensus Signal",
  "consensus.buy": "BUY",
  "consensus.sell": "SELL",
  "consensus.hold": "HOLD",
  "consensus.methods": "{count, plural, =1{1 method} other{# methods}}",
  "consensus.confirming":
    "{count, plural, =0{No confirmations} =1{1 confirming} other{# confirming}}",

  // ── Alerts ──
  "alerts.title": "Alerts",
  "alerts.noAlerts": "No active alerts.",
  "alerts.triggered": "Triggered",
  "alerts.active": "Active",
  "alerts.create": "Create Alert",
  "alerts.priceAbove": "Price above",
  "alerts.priceBelow": "Price below",

  // ── Portfolio ──
  "portfolio.title": "Portfolio",
  "portfolio.totalValue": "Total Value",
  "portfolio.dayChange": "Day Change",
  "portfolio.allocation": "Allocation",
  "portfolio.addHolding": "Add Holding",
  "portfolio.shares": "{count, plural, =1{1 share} other{# shares}}",

  // ── Backtest ──
  "backtest.title": "Backtest",
  "backtest.run": "Run Backtest",
  "backtest.results": "Results",
  "backtest.trades": "{count, plural, =0{No trades} =1{1 trade} other{# trades}}",
  "backtest.winRate": "Win Rate",
  "backtest.maxDrawdown": "Max Drawdown",
  "backtest.sharpe": "Sharpe Ratio",

  // ── Screener ──
  "screener.title": "Screener",
  "screener.filter": "Filter",
  "screener.results": "{count, plural, =0{No results} =1{1 result} other{# results}}",

  // ── Settings ──
  "settings.title": "Settings",
  "settings.theme": "Theme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
  "settings.language": "Language",
  "settings.dataProvider": "Data Provider",
  "settings.notifications": "Notifications",
  "settings.clearData": "Clear All Data",

  // ── Errors ──
  "error.network": "Network error. Please check your connection.",
  "error.rateLimit": "Rate limit exceeded. Please try again later.",
  "error.notFound": "Symbol not found.",
  "error.generic": "Something went wrong. Please try again.",

  // ── Time ──
  "time.lastUpdated": "Last updated {time}",
  "time.marketClosed": "Market closed",
  "time.marketOpen": "Market open",
} as const;

registerLocale("en", en);

export type MessageKeys = keyof typeof en;
export default en;
