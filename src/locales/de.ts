/**
 * German (de) locale translations.
 */
import { registerLocale } from "../core/i18n-catalog";

const de = {
  // ── Navigation ──
  "nav.watchlist": "Watchlist",
  "nav.chart": "Chart",
  "nav.screener": "Screener",
  "nav.alerts": "Alarme",
  "nav.portfolio": "Portfolio",
  "nav.backtest": "Backtest",
  "nav.consensus": "Konsens",
  "nav.heatmap": "Heatmap",
  "nav.settings": "Einstellungen",

  // ── Common actions ──
  "action.add": "Hinzufügen",
  "action.remove": "Entfernen",
  "action.save": "Speichern",
  "action.cancel": "Abbrechen",
  "action.export": "Exportieren",
  "action.import": "Importieren",
  "action.clear": "Alles löschen",
  "action.refresh": "Aktualisieren",
  "action.search": "Suchen",
  "action.close": "Schließen",
  "action.confirm": "Bestätigen",
  "action.delete": "Löschen",

  // ── Watchlist ──
  "watchlist.title": "Watchlist",
  "watchlist.addTicker": "Symbol hinzufügen…",
  "watchlist.empty": "Noch keine Symbole hinzugefügt. Gib oben ein Symbol ein.",
  "watchlist.price": "Kurs",
  "watchlist.change": "Änderung",
  "watchlist.volume": "Volumen",
  "watchlist.marketCap": "Marktkapitalisierung",

  // ── Chart ──
  "chart.title": "Chart",
  "chart.timeframe": "Zeitrahmen",
  "chart.indicators": "Indikatoren",
  "chart.drawingTools": "Zeichenwerkzeuge",
  "chart.fullscreen": "Vollbild",

  // ── Consensus ──
  "consensus.title": "Konsenssignal",
  "consensus.buy": "KAUFEN",
  "consensus.sell": "VERKAUFEN",
  "consensus.hold": "HALTEN",
  "consensus.methods": "{count, plural, =1{1 Methode} other{# Methoden}}",
  "consensus.confirming":
    "{count, plural, =0{Keine Bestätigungen} =1{1 Bestätigung} other{# Bestätigungen}}",

  // ── Alerts ──
  "alerts.title": "Alarme",
  "alerts.noAlerts": "Keine aktiven Alarme.",
  "alerts.triggered": "Ausgelöst",
  "alerts.active": "Aktiv",
  "alerts.create": "Alarm erstellen",
  "alerts.priceAbove": "Preis über",
  "alerts.priceBelow": "Preis unter",

  // ── Portfolio ──
  "portfolio.title": "Portfolio",
  "portfolio.totalValue": "Gesamtwert",
  "portfolio.dayChange": "Tagesänderung",
  "portfolio.allocation": "Allokation",
  "portfolio.addHolding": "Position hinzufügen",
  "portfolio.shares": "{count, plural, =1{1 Aktie} other{# Aktien}}",

  // ── Backtest ──
  "backtest.title": "Backtest",
  "backtest.run": "Backtest starten",
  "backtest.results": "Ergebnisse",
  "backtest.trades": "{count, plural, =0{Keine Trades} =1{1 Trade} other{# Trades}}",
  "backtest.winRate": "Gewinnrate",
  "backtest.maxDrawdown": "Max. Drawdown",
  "backtest.sharpe": "Sharpe-Ratio",

  // ── Screener ──
  "screener.title": "Aktienscreener",
  "screener.filter": "Filtern",
  "screener.results": "{count, plural, =0{Keine Ergebnisse} =1{1 Ergebnis} other{# Ergebnisse}}",

  // ── Settings ──
  "settings.title": "Einstellungen",
  "settings.theme": "Design",
  "settings.themeDark": "Dunkel",
  "settings.themeLight": "Hell",
  "settings.language": "Sprache",
  "settings.dataProvider": "Datenanbieter",
  "settings.notifications": "Benachrichtigungen",
  "settings.clearData": "Alle Daten löschen",

  // ── Errors ──
  "error.network": "Netzwerkfehler. Bitte Verbindung prüfen.",
  "error.rateLimit": "Anfragelimit überschritten. Bitte später erneut versuchen.",
  "error.notFound": "Symbol nicht gefunden.",
  "error.generic": "Etwas ist schiefgelaufen. Bitte erneut versuchen.",

  // ── Time ──
  "time.lastUpdated": "Zuletzt aktualisiert {time}",
  "time.marketClosed": "Markt geschlossen",
  "time.marketOpen": "Markt geöffnet",
} as const;

registerLocale("de", de);
export default de;
