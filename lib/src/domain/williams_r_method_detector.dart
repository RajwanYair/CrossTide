/// Williams %R Method Detector — Pure domain logic.
///
/// Uses the 14-period Williams %R oscillator to detect reversal signals:
///
/// **BUY signal**: Williams %R exits oversold territory.
///   %R[t-1] < −80 AND %R[t] >= −80
///
/// **SELL signal**: Williams %R exits overbought territory.
///   %R[t-1] > −20 AND %R[t] <= −20
///
/// Williams %R oscillates between 0 and −100:
///   − Values near 0 are overbought.
///   − Values near −100 are oversold.
library;

import 'entities.dart';
import 'micho_method_detector.dart';
import 'technical_defaults.dart';
import 'williams_percent_r_calculator.dart';

class WilliamsRMethodDetector {
  const WilliamsRMethodDetector({
    this.calculator = const WilliamsPercentRCalculator(),
    this.oversoldThreshold = TechnicalDefaults.williamsROversold,
    this.overboughtThreshold = TechnicalDefaults.williamsROverbought,
    this.period = TechnicalDefaults.defaultPeriod,
  });

  final WilliamsPercentRCalculator calculator;
  final double oversoldThreshold;
  final double overboughtThreshold;
  final int period;

  static const String methodName = 'Williams %R';

  /// Minimum candles needed: period + 1 (for two consecutive readings).
  int get requiredCandles => period + 1;

  /// Evaluate for a Williams %R Method **BUY** signal.
  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // %R exits oversold: %R[t-1] < threshold AND %R[t] >= threshold
    final bool isTriggered =
        data.previousWr < oversoldThreshold &&
        data.currentWr >= oversoldThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.williamsRMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: Williams %R exited oversold '
                '(${data.previousWr.toStringAsFixed(1)} → '
                '${data.currentWr.toStringAsFixed(1)})'
          : null,
    );
  }

  /// Evaluate for a Williams %R Method **SELL** signal.
  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // %R exits overbought: %R[t-1] > threshold AND %R[t] <= threshold
    final bool isTriggered =
        data.previousWr > overboughtThreshold &&
        data.currentWr <= overboughtThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.williamsRMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: Williams %R exited overbought '
                '(${data.previousWr.toStringAsFixed(1)} → '
                '${data.currentWr.toStringAsFixed(1)})'
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

  _WrBase? _computeBase(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = calculator.computeSeries(candles, period: period);
    if (series.length < 2) return null;

    final double? currentWr = series[series.length - 1].$2;
    final double? previousWr = series[series.length - 2].$2;

    if (currentWr == null || previousWr == null) return null;

    return _WrBase(currentWr: currentWr, previousWr: previousWr);
  }
}

class _WrBase {
  const _WrBase({required this.currentWr, required this.previousWr});
  final double currentWr;
  final double previousWr;
}
