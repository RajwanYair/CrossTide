/**
 * Hebrew (he) locale translations — RTL language.
 */
import { registerLocale } from "../core/i18n-catalog";

const he = {
  // ── Navigation ──
  "nav.watchlist": "רשימת מעקב",
  "nav.chart": "גרף",
  "nav.screener": "סורק",
  "nav.alerts": "התראות",
  "nav.portfolio": "תיק השקעות",
  "nav.backtest": "בדיקה לאחור",
  "nav.consensus": "קונצנזוס",
  "nav.heatmap": "מפת חום",
  "nav.settings": "הגדרות",

  // ── Common actions ──
  "action.add": "הוסף",
  "action.remove": "הסר",
  "action.save": "שמור",
  "action.cancel": "בטל",
  "action.export": "ייצוא",
  "action.import": "ייבוא",
  "action.clear": "נקה הכל",
  "action.refresh": "רענן",
  "action.search": "חפש",
  "action.close": "סגור",
  "action.confirm": "אשר",
  "action.delete": "מחק",

  // ── Watchlist ──
  "watchlist.title": "רשימת מעקב",
  "watchlist.addTicker": "הוסף סימול מניה…",
  "watchlist.empty": "עדיין לא נוספו מניות. הקלד סימול למעלה כדי להתחיל.",
  "watchlist.price": "מחיר",
  "watchlist.change": "שינוי",
  "watchlist.volume": "מחזור",
  "watchlist.marketCap": "שווי שוק",

  // ── Chart ──
  "chart.title": "גרף",
  "chart.timeframe": "טווח זמן",
  "chart.indicators": "אינדיקטורים",
  "chart.drawingTools": "כלי ציור",
  "chart.fullscreen": "מסך מלא",

  // ── Consensus ──
  "consensus.title": "אות קונצנזוס",
  "consensus.buy": "קנייה",
  "consensus.sell": "מכירה",
  "consensus.hold": "החזקה",
  "consensus.methods": "{count, plural, =1{שיטה אחת} other{# שיטות}}",
  "consensus.confirming": "{count, plural, =0{ללא אישורים} =1{אישור אחד} other{# אישורים}}",

  // ── Alerts ──
  "alerts.title": "התראות",
  "alerts.noAlerts": "אין התראות פעילות.",
  "alerts.triggered": "הופעלה",
  "alerts.active": "פעילה",
  "alerts.create": "צור התראה",
  "alerts.priceAbove": "מחיר מעל",
  "alerts.priceBelow": "מחיר מתחת",

  // ── Portfolio ──
  "portfolio.title": "תיק השקעות",
  "portfolio.totalValue": "שווי כולל",
  "portfolio.dayChange": "שינוי יומי",
  "portfolio.allocation": "הקצאה",
  "portfolio.addHolding": "הוסף אחזקה",
  "portfolio.shares": "{count, plural, =1{מניה אחת} other{# מניות}}",

  // ── Backtest ──
  "backtest.title": "בדיקה לאחור",
  "backtest.run": "הפעל בדיקה",
  "backtest.results": "תוצאות",
  "backtest.trades": "{count, plural, =0{ללא עסקאות} =1{עסקה אחת} other{# עסקאות}}",
  "backtest.winRate": "אחוז הצלחה",
  "backtest.maxDrawdown": "ירידה מקסימלית",
  "backtest.sharpe": "יחס שארפ",

  // ── Screener ──
  "screener.title": "סורק מניות",
  "screener.filter": "סנן",
  "screener.results": "{count, plural, =0{אין תוצאות} =1{תוצאה אחת} other{# תוצאות}}",

  // ── Settings ──
  "settings.title": "הגדרות",
  "settings.theme": "עיצוב",
  "settings.themeDark": "כהה",
  "settings.themeLight": "בהיר",
  "settings.language": "שפה",
  "settings.dataProvider": "ספק נתונים",
  "settings.notifications": "התראות",
  "settings.clearData": "מחק את כל הנתונים",

  // ── Errors ──
  "error.network": "שגיאת רשת. בדוק את החיבור שלך.",
  "error.rateLimit": "חריגה ממגבלת בקשות. נסה שוב מאוחר יותר.",
  "error.notFound": "הסימול לא נמצא.",
  "error.generic": "משהו השתבש. נסה שוב.",

  // ── Time ──
  "time.lastUpdated": "עודכן לאחרונה {time}",
  "time.marketClosed": "השוק סגור",
  "time.marketOpen": "השוק פתוח",
} as const;

registerLocale("he", he);
export default he;
