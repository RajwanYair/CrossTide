/**
 * Japanese (ja) locale translations.
 */
import { registerLocale } from "../core/i18n-catalog";

const ja = {
  // ── Navigation ──
  "nav.watchlist": "ウォッチリスト",
  "nav.chart": "チャート",
  "nav.screener": "スクリーナー",
  "nav.alerts": "アラート",
  "nav.portfolio": "ポートフォリオ",
  "nav.backtest": "バックテスト",
  "nav.consensus": "コンセンサス",
  "nav.heatmap": "ヒートマップ",
  "nav.settings": "設定",

  // ── Common actions ──
  "action.add": "追加",
  "action.remove": "削除",
  "action.save": "保存",
  "action.cancel": "キャンセル",
  "action.export": "エクスポート",
  "action.import": "インポート",
  "action.clear": "すべて消去",
  "action.refresh": "更新",
  "action.search": "検索",
  "action.close": "閉じる",
  "action.confirm": "確認",
  "action.delete": "削除",

  // ── Watchlist ──
  "watchlist.title": "ウォッチリスト",
  "watchlist.addTicker": "ティッカーシンボルを追加…",
  "watchlist.empty": "まだ銘柄が追加されていません。上でシンボルを入力してください。",
  "watchlist.price": "価格",
  "watchlist.change": "変動",
  "watchlist.volume": "出来高",
  "watchlist.marketCap": "時価総額",

  // ── Chart ──
  "chart.title": "チャート",
  "chart.timeframe": "時間軸",
  "chart.indicators": "インジケーター",
  "chart.drawingTools": "描画ツール",
  "chart.fullscreen": "全画面",

  // ── Consensus ──
  "consensus.title": "コンセンサスシグナル",
  "consensus.buy": "買い",
  "consensus.sell": "売り",
  "consensus.hold": "保持",
  "consensus.methods": "{count, plural, =1{1つの手法} other{#つの手法}}",
  "consensus.confirming": "{count, plural, =0{確認なし} =1{1つ確認} other{#つ確認}}",

  // ── Alerts ──
  "alerts.title": "アラート",
  "alerts.noAlerts": "有効なアラートはありません。",
  "alerts.triggered": "発動済み",
  "alerts.active": "有効",
  "alerts.create": "アラートを作成",
  "alerts.priceAbove": "価格が以上",
  "alerts.priceBelow": "価格が以下",

  // ── Portfolio ──
  "portfolio.title": "ポートフォリオ",
  "portfolio.totalValue": "合計評価額",
  "portfolio.dayChange": "本日の変動",
  "portfolio.allocation": "配分",
  "portfolio.addHolding": "保有銘柄を追加",
  "portfolio.shares": "{count, plural, =1{1株} other{#株}}",

  // ── Backtest ──
  "backtest.title": "バックテスト",
  "backtest.run": "バックテストを実行",
  "backtest.results": "結果",
  "backtest.trades": "{count, plural, =0{取引なし} =1{1回の取引} other{#回の取引}}",
  "backtest.winRate": "勝率",
  "backtest.maxDrawdown": "最大ドローダウン",
  "backtest.sharpe": "シャープレシオ",

  // ── Screener ──
  "screener.title": "スクリーナー",
  "screener.filter": "フィルター",
  "screener.results": "{count, plural, =0{結果なし} =1{1件} other{#件}}",

  // ── Settings ──
  "settings.title": "設定",
  "settings.theme": "テーマ",
  "settings.themeDark": "ダーク",
  "settings.themeLight": "ライト",
  "settings.language": "言語",
  "settings.dataProvider": "データプロバイダー",
  "settings.notifications": "通知",
  "settings.clearData": "全データを消去",

  // ── Errors ──
  "error.network": "ネットワークエラーです。接続を確認してください。",
  "error.rateLimit": "リクエスト制限を超えました。しばらくしてからもう一度お試しください。",
  "error.notFound": "シンボルが見つかりません。",
  "error.generic": "エラーが発生しました。もう一度お試しください。",

  // ── Time ──
  "time.lastUpdated": "{time} に更新",
  "time.marketClosed": "市場閉場",
  "time.marketOpen": "市場開場",
} as const;

registerLocale("ja", ja);
export default ja;
