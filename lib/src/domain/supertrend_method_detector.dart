/// SuperTrend Method Detector — Pure domain logic.
///
/// Uses the SuperTrend indicator (ATR-based trend-following band) to detect
/// trend-flip signals:
///
/// **BUY signal**: SuperTrend flips from downtrend to uptrend.
///   isUpTrend[t-1] == false AND isUpTrend[t] == true
///
/// **SELL signal**: SuperTrend flips from uptrend to downtrend.
///   isUpTrend[t-1] == true AND isUpTrend[t] == false
///
/// Default parameters: ATR period 10, multiplier 3.0.
library;

import 'entities.dart';
import 'micho_method_detector.dart';
import 'supertrend_calculator.dart';

class SupertrendMethodDetector {
  const SupertrendMethodDetector({
    this.supertrendCalculator = const SuperTrendCalculator(),
  });

  final SuperTrendCalculator supertrendCalculator;

  static const String methodName = 'SuperTrend';

  /// Minimum candles needed: ATR period + warmup + 2 results for comparison.
  int get requiredCandles => supertrendCalculator.atrPeriod + 4;

  /// Evaluate for a SuperTrend Method **BUY** signal.
  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // Flip to uptrend: prev was downtrend, curr is uptrend
    final bool isTriggered = !data.prevIsUp && data.currIsUp;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.supertrendMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: SuperTrend flipped bullish '
                '(band=${data.currSuperTrend.toStringAsFixed(2)})'
          : null,
    );
  }

  /// Evaluate for a SuperTrend Method **SELL** signal.
  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // Flip to downtrend: prev was uptrend, curr is downtrend
    final bool isTriggered = data.prevIsUp && !data.currIsUp;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.supertrendMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: SuperTrend flipped bearish '
                '(band=${data.currSuperTrend.toStringAsFixed(2)})'
          : null,
    );
  }

  /// Evaluate both BUY and SELL. Only triggered signals are returned.
  List<MethodSignal> evaluateBoth({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final buy = evaluateBuy(ticker: ticker, candles: candles);
    final sell = evaluateSell(ticker: ticker, candles: candles);
    return [
      if (buy != null && buy.isTriggered) buy,
      if (sell != null && sell.isTriggered) sell,
    ];
  }

  _StData? _data(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = supertrendCalculator.computeSeries(candles);
    if (series.length < 2) return null;

    final SuperTrendResult curr = series[series.length - 1];
    final SuperTrendResult prev = series[series.length - 2];

    return _StData(
      currSuperTrend: curr.superTrend,
      currIsUp: curr.isUpTrend,
      prevIsUp: prev.isUpTrend,
    );
  }
}

class _StData {
  const _StData({
    required this.currSuperTrend,
    required this.currIsUp,
    required this.prevIsUp,
  });
  final double currSuperTrend;
  final bool currIsUp;
  final bool prevIsUp;
}
