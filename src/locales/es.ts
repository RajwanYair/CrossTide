/**
 * Spanish (es) locale translations.
 */
import { registerLocale } from "../core/i18n-catalog";

const es = {
  // ── Navigation ──
  "nav.watchlist": "Lista de seguimiento",
  "nav.chart": "Gráfico",
  "nav.screener": "Filtro",
  "nav.alerts": "Alertas",
  "nav.portfolio": "Cartera",
  "nav.backtest": "Backtest",
  "nav.consensus": "Consenso",
  "nav.heatmap": "Mapa de calor",
  "nav.settings": "Configuración",

  // ── Common actions ──
  "action.add": "Añadir",
  "action.remove": "Eliminar",
  "action.save": "Guardar",
  "action.cancel": "Cancelar",
  "action.export": "Exportar",
  "action.import": "Importar",
  "action.clear": "Borrar todo",
  "action.refresh": "Actualizar",
  "action.search": "Buscar",
  "action.close": "Cerrar",
  "action.confirm": "Confirmar",
  "action.delete": "Eliminar",

  // ── Watchlist ──
  "watchlist.title": "Lista de seguimiento",
  "watchlist.addTicker": "Añadir símbolo…",
  "watchlist.empty": "No hay símbolos añadidos. Escribe un símbolo arriba para comenzar.",
  "watchlist.price": "Precio",
  "watchlist.change": "Cambio",
  "watchlist.volume": "Volumen",
  "watchlist.marketCap": "Cap. de mercado",

  // ── Chart ──
  "chart.title": "Gráfico",
  "chart.timeframe": "Temporalidad",
  "chart.indicators": "Indicadores",
  "chart.drawingTools": "Herramientas de dibujo",
  "chart.fullscreen": "Pantalla completa",

  // ── Consensus ──
  "consensus.title": "Señal de consenso",
  "consensus.buy": "COMPRAR",
  "consensus.sell": "VENDER",
  "consensus.hold": "MANTENER",
  "consensus.methods": "{count, plural, =1{1 método} other{# métodos}}",
  "consensus.confirming":
    "{count, plural, =0{Sin confirmaciones} =1{1 confirmación} other{# confirmaciones}}",

  // ── Alerts ──
  "alerts.title": "Alertas",
  "alerts.noAlerts": "No hay alertas activas.",
  "alerts.triggered": "Activada",
  "alerts.active": "Activa",
  "alerts.create": "Crear alerta",
  "alerts.priceAbove": "Precio por encima de",
  "alerts.priceBelow": "Precio por debajo de",

  // ── Portfolio ──
  "portfolio.title": "Cartera",
  "portfolio.totalValue": "Valor total",
  "portfolio.dayChange": "Cambio diario",
  "portfolio.allocation": "Distribución",
  "portfolio.addHolding": "Añadir posición",
  "portfolio.shares": "{count, plural, =1{1 acción} other{# acciones}}",

  // ── Backtest ──
  "backtest.title": "Backtest",
  "backtest.run": "Ejecutar backtest",
  "backtest.results": "Resultados",
  "backtest.trades": "{count, plural, =0{Sin operaciones} =1{1 operación} other{# operaciones}}",
  "backtest.winRate": "Tasa de acierto",
  "backtest.maxDrawdown": "Drawdown máximo",
  "backtest.sharpe": "Ratio de Sharpe",

  // ── Screener ──
  "screener.title": "Filtro de acciones",
  "screener.filter": "Filtrar",
  "screener.results": "{count, plural, =0{Sin resultados} =1{1 resultado} other{# resultados}}",

  // ── Settings ──
  "settings.title": "Configuración",
  "settings.theme": "Tema",
  "settings.themeDark": "Oscuro",
  "settings.themeLight": "Claro",
  "settings.language": "Idioma",
  "settings.dataProvider": "Proveedor de datos",
  "settings.notifications": "Notificaciones",
  "settings.clearData": "Borrar todos los datos",

  // ── Errors ──
  "error.network": "Error de red. Comprueba tu conexión.",
  "error.rateLimit": "Límite de solicitudes excedido. Inténtalo más tarde.",
  "error.notFound": "Símbolo no encontrado.",
  "error.generic": "Algo salió mal. Inténtalo de nuevo.",

  // ── Time ──
  "time.lastUpdated": "Última actualización {time}",
  "time.marketClosed": "Mercado cerrado",
  "time.marketOpen": "Mercado abierto",
} as const;

registerLocale("es", es);
export default es;
