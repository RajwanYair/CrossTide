/**
 * Chinese Simplified (zh) locale translations.
 */
import { registerLocale } from "../core/i18n-catalog";

const zh = {
  // ── Navigation ──
  "nav.watchlist": "自选股",
  "nav.chart": "图表",
  "nav.screener": "筛选器",
  "nav.alerts": "警报",
  "nav.portfolio": "投资组合",
  "nav.backtest": "回测",
  "nav.consensus": "共识信号",
  "nav.heatmap": "热力图",
  "nav.settings": "设置",

  // ── Common actions ──
  "action.add": "添加",
  "action.remove": "移除",
  "action.save": "保存",
  "action.cancel": "取消",
  "action.export": "导出",
  "action.import": "导入",
  "action.clear": "全部清除",
  "action.refresh": "刷新",
  "action.search": "搜索",
  "action.close": "关闭",
  "action.confirm": "确认",
  "action.delete": "删除",

  // ── Watchlist ──
  "watchlist.title": "自选股",
  "watchlist.addTicker": "添加股票代码…",
  "watchlist.empty": "尚未添加股票。在上方输入代码开始使用。",
  "watchlist.price": "价格",
  "watchlist.change": "涨跌",
  "watchlist.volume": "成交量",
  "watchlist.marketCap": "市值",

  // ── Chart ──
  "chart.title": "图表",
  "chart.timeframe": "时间周期",
  "chart.indicators": "指标",
  "chart.drawingTools": "画图工具",
  "chart.fullscreen": "全屏",

  // ── Consensus ──
  "consensus.title": "共识信号",
  "consensus.buy": "买入",
  "consensus.sell": "卖出",
  "consensus.hold": "持有",
  "consensus.methods": "{count, plural, other{#种方法}}",
  "consensus.confirming": "{count, plural, =0{无确认} other{#个确认}}",

  // ── Alerts ──
  "alerts.title": "警报",
  "alerts.noAlerts": "没有活跃的警报。",
  "alerts.triggered": "已触发",
  "alerts.active": "活跃",
  "alerts.create": "创建警报",
  "alerts.priceAbove": "价格高于",
  "alerts.priceBelow": "价格低于",

  // ── Portfolio ──
  "portfolio.title": "投资组合",
  "portfolio.totalValue": "总价值",
  "portfolio.dayChange": "日涨跌",
  "portfolio.allocation": "配置",
  "portfolio.addHolding": "添加持仓",
  "portfolio.shares": "{count, plural, other{#股}}",

  // ── Backtest ──
  "backtest.title": "回测",
  "backtest.run": "运行回测",
  "backtest.results": "结果",
  "backtest.trades": "{count, plural, =0{无交易} other{#笔交易}}",
  "backtest.winRate": "胜率",
  "backtest.maxDrawdown": "最大回撤",
  "backtest.sharpe": "夏普比率",

  // ── Screener ──
  "screener.title": "股票筛选器",
  "screener.filter": "筛选",
  "screener.results": "{count, plural, =0{无结果} other{#个结果}}",

  // ── Settings ──
  "settings.title": "设置",
  "settings.theme": "主题",
  "settings.themeDark": "深色",
  "settings.themeLight": "浅色",
  "settings.language": "语言",
  "settings.dataProvider": "数据源",
  "settings.notifications": "通知",
  "settings.clearData": "清除所有数据",

  // ── Errors ──
  "error.network": "网络错误，请检查连接。",
  "error.rateLimit": "请求频率超限，请稍后再试。",
  "error.notFound": "未找到该代码。",
  "error.generic": "出现问题，请重试。",

  // ── Time ──
  "time.lastUpdated": "最后更新 {time}",
  "time.marketClosed": "休市",
  "time.marketOpen": "开市",
} as const;

registerLocale("zh", zh);
export default zh;
