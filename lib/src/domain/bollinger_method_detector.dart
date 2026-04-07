/// Bollinger Bands Method Detector — Pure domain logic.
///
/// Uses standard Bollinger Bands (20-period, 2× stddev) to detect
/// mean-reversion / breakout signals:
///
/// **BUY signal**: Price crosses above the lower band from below.
///   close[t-1] <= lower[t-1] AND close[t] > lower[t]
///
/// **SELL signal**: Price crosses below the upper band from above.
///   close[t-1] >= upper[t-1] AND close[t] < upper[t]
///
/// Follows the same [MethodSignal] pattern as [MichoMethodDetector].
library;

import 'bollinger_calculator.dart';
import 'entities.dart';
import 'micho_method_detector.dart';

class BollingerMethodDetector {
  const BollingerMethodDetector({
    this.bollingerCalculator = const BollingerCalculator(),
  });

  final BollingerCalculator bollingerCalculator;

  static const String methodName = 'Bollinger Bands';

  /// Minimum candles: period(20) + 1 for comparison.
  static const int requiredCandles = 21;

  /// Evaluate for a Bollinger Method **BUY** signal.
  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // Price crosses above lower band
    final isTriggered =
        data.prevClose <= data.prevLower && data.currClose > data.currLower;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.bollingerMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: data.currClose,
      description: isTriggered
          ? 'BUY: price crossed above lower Bollinger Band '
                '(\$${data.currClose.toStringAsFixed(2)} > '
                '\$${data.currLower.toStringAsFixed(2)})'
          : null,
    );
  }

  /// Evaluate for a Bollinger Method **SELL** signal.
  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // Price crosses below upper band
    final isTriggered =
        data.prevClose >= data.prevUpper && data.currClose < data.currUpper;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.bollingerMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: data.currClose,
      description: isTriggered
          ? 'SELL: price crossed below upper Bollinger Band '
                '(\$${data.currClose.toStringAsFixed(2)} < '
                '\$${data.currUpper.toStringAsFixed(2)})'
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

  _BollingerBaseData? _computeBase(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = bollingerCalculator.computeSeries(candles);

    // Need last two complete entries
    final curr = series[series.length - 1];
    final prev = series[series.length - 2];
    if (curr.upper == null ||
        curr.lower == null ||
        prev.upper == null ||
        prev.lower == null) {
      return null;
    }

    return _BollingerBaseData(
      currClose: candles[candles.length - 1].close,
      prevClose: candles[candles.length - 2].close,
      currUpper: curr.upper!,
      currLower: curr.lower!,
      prevUpper: prev.upper!,
      prevLower: prev.lower!,
    );
  }
}

class _BollingerBaseData {
  const _BollingerBaseData({
    required this.currClose,
    required this.prevClose,
    required this.currUpper,
    required this.currLower,
    required this.prevUpper,
    required this.prevLower,
  });

  final double currClose;
  final double prevClose;
  final double currUpper;
  final double currLower;
  final double prevUpper;
  final double prevLower;
}
