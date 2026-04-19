/// ADX Method Detector — Pure domain logic.
///
/// Detects trend-strength signals using ADX and DI crossovers:
/// **BUY**: ADX > [threshold] (25) AND +DI crosses above −DI.
/// **SELL**: ADX > [threshold] AND −DI crosses above +DI.
library;

import 'adx_calculator.dart';
import 'entities.dart';
import 'micho_method_detector.dart';
import 'technical_defaults.dart';

class AdxMethodDetector {
  const AdxMethodDetector({
    this.adxCalculator = const AdxCalculator(),
    this.threshold = 25.0,
    this.period = TechnicalDefaults.defaultPeriod,
  });

  final AdxCalculator adxCalculator;

  /// ADX must be above this value for a signal to fire.
  final double threshold;
  final int period;

  static const String methodName = 'ADX Trend';

  int get requiredCandles => 2 * period + 2;

  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // +DI crosses above −DI while ADX signals strong trend
    final bool isTriggered =
        data.curr.adx > threshold &&
        data.prev.plusDi <= data.prev.minusDi &&
        data.curr.plusDi > data.curr.minusDi;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.adxMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: +DI crossed above −DI with ADX=${data.curr.adx.toStringAsFixed(1)}'
          : null,
    );
  }

  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // −DI crosses above +DI while ADX signals strong trend
    final bool isTriggered =
        data.curr.adx > threshold &&
        data.prev.minusDi <= data.prev.plusDi &&
        data.curr.minusDi > data.curr.plusDi;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.adxMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: −DI crossed above +DI with ADX=${data.curr.adx.toStringAsFixed(1)}'
          : null,
    );
  }

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

  _AdxPair? _data(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = adxCalculator.computeSeries(candles, period: period);
    if (series.length < 2) return null;

    return _AdxPair(
      curr: series[series.length - 1],
      prev: series[series.length - 2],
    );
  }
}

class _AdxPair {
  const _AdxPair({required this.curr, required this.prev});

  final AdxResult curr;
  final AdxResult prev;
}
