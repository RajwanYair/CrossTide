import 'package:equatable/equatable.dart';

/// Chart layout style preference.
enum ChartLayoutStyle { line, candlestick, ohlcBar, area }

/// SMA overlay visibility preferences.
class SmaOverlayConfig extends Equatable {
  const SmaOverlayConfig({
    this.showSma50 = true,
    this.showSma150 = false,
    this.showSma200 = true,
    this.showEma20 = false,
  });

  final bool showSma50;
  final bool showSma150;
  final bool showSma200;
  final bool showEma20;

  bool get hasAnyOverlay => showSma50 || showSma150 || showSma200 || showEma20;

  @override
  List<Object?> get props => [showSma50, showSma150, showSma200, showEma20];
}

/// Per-ticker chart display configuration.
class ChartDisplayConfig extends Equatable {
  const ChartDisplayConfig({
    required this.symbol,
    this.layoutStyle = ChartLayoutStyle.line,
    this.smaOverlay = const SmaOverlayConfig(),
    this.showVolume = true,
    this.showBenchmark = false,
    this.showSignalMarkers = true,
    this.defaultRangeDays = 365,
  }) : assert(defaultRangeDays > 0, 'defaultRangeDays must be > 0');

  final String symbol;
  final ChartLayoutStyle layoutStyle;
  final SmaOverlayConfig smaOverlay;
  final bool showVolume;
  final bool showBenchmark;
  final bool showSignalMarkers;
  final int defaultRangeDays;

  bool get isCandlestick => layoutStyle == ChartLayoutStyle.candlestick;
  bool get isLineChart => layoutStyle == ChartLayoutStyle.line;

  ChartDisplayConfig withLayout(ChartLayoutStyle style) => ChartDisplayConfig(
    symbol: symbol,
    layoutStyle: style,
    smaOverlay: smaOverlay,
    showVolume: showVolume,
    showBenchmark: showBenchmark,
    showSignalMarkers: showSignalMarkers,
    defaultRangeDays: defaultRangeDays,
  );

  ChartDisplayConfig withSmaOverlay(SmaOverlayConfig overlay) =>
      ChartDisplayConfig(
        symbol: symbol,
        layoutStyle: layoutStyle,
        smaOverlay: overlay,
        showVolume: showVolume,
        showBenchmark: showBenchmark,
        showSignalMarkers: showSignalMarkers,
        defaultRangeDays: defaultRangeDays,
      );

  @override
  List<Object?> get props => [
    symbol,
    layoutStyle,
    smaOverlay,
    showVolume,
    showBenchmark,
    showSignalMarkers,
    defaultRangeDays,
  ];
}
