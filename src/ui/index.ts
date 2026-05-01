export {
  initRouter,
  navigateTo,
  navigateToPath,
  buildPath,
  getCurrentRoute,
  getCurrentRouteInfo,
  onRouteChange,
} from "./router";
export type { RouteName, RouteInfo, RouteChangeHandler } from "./router";
export { initTheme, applyTheme } from "./theme";
export type { Theme } from "./theme";
export { renderWatchlist } from "./watchlist";
export { showToast, clearAllToasts, toastCount } from "./toast";
export type { ToastType, ToastOptions } from "./toast";
export { renderSparkline } from "./sparkline";
export type { SparklineOptions } from "./sparkline";
export { openModal, closeModal, isModalOpen } from "./modal";
export type { ModalOptions } from "./modal";
export { sortRows, toggleSort } from "./sortable";
export type { SortConfig, SortDirection } from "./sortable";
export { announce, trapFocus, prefersReducedMotion } from "./a11y";
export {
  scoreCommand,
  rankCommands,
  createPaletteState,
} from "./command-palette";
export type {
  PaletteCommand,
  PaletteRanked,
  PaletteState,
} from "./command-palette";
export {
  createReorderState,
  startDrag,
  dragOver,
  endDrag,
  moveItem,
} from "./reorder";
export type { ReorderState } from "./reorder";
export { buildSparklinePaths } from "./multi-sparkline";
export type {
  SparklineSeries,
  SparklineLayout,
  SparklinePath,
} from "./multi-sparkline";
export { computeRangeBar, rangeFromCandles } from "./range-bar";
export type { RangeBarInput, RangeBarGeometry } from "./range-bar";
export { classifyWidth, observeContainer } from "./container-query";
export type {
  ContainerSize,
  ContainerSizeBreakpoints,
  ContainerQueryHandle,
  ContainerQueryOptions,
} from "./container-query";
export {
  SHORTCUTS,
  shortcutsByCategory,
  findShortcut,
  formatKeys,
  searchShortcuts,
} from "./shortcuts-catalog";
export type {
  KeyboardShortcut,
  ShortcutCategory,
} from "./shortcuts-catalog";
export {
  parseHexColor,
  relativeLuminance,
  contrastRatio,
  meetsWcag,
  prefersMoreContrast,
} from "./contrast";
export type { RGB, WcagLevel, WcagSize } from "./contrast";
export {
  classifyFreshness,
  ageBetween,
  formatAge,
  freshnessLabel,
} from "./freshness";
export type { FreshnessBucket, FreshnessConfig } from "./freshness";

export { emptyDrawingState, addShape, removeShape, updateShape, hitTest, fibLevelPrice, DEFAULT_FIB_LEVELS } from "./drawing";
export type { Shape, Trendline, HLine, FibRetracement, Point, DrawingKind, DrawingState, HitTestOptions } from "./drawing";


export { getPalette, pickColor, isHexColor, PALETTE_NAMES } from "./palettes";
export type { Palette, PaletteName, SemanticColor } from "./palettes";


export { formatPrice, formatCompact, formatPercent, formatChange } from "./number-format";
export type { FormatOptions } from "./number-format";


export { squarifyTreemap } from "./treemap-layout";
export type { TreemapItem, TreemapRect, Bounds } from "./treemap-layout";


export { interpolateColor, createColorScale, createDivergentScale } from "./color-scale";
export type { ColorStop, ColorScale, ColorScaleOptions } from "./color-scale";


export { formatRelativeTime } from "./relative-time";
export type { RelativeTimeOptions } from "./relative-time";

