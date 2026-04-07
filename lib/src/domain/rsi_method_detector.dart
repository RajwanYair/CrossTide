/// RSI Method Detector — Pure domain logic.
///
/// Uses the standard 14-period RSI to detect reversal signals:
///
/// **BUY signal**: RSI exits oversold territory.
///   RSI[t-1] < 30 AND RSI[t] >= 30
///
/// **SELL signal**: RSI exits overbought territory.
///   RSI[t-1] > 70 AND RSI[t] <= 70
///
/// Follows the same [MethodSignal] pattern as [MichoMethodDetector] for
/// uniform handling across all trading methods.
library;

import 'entities.dart';
import 'micho_method_detector.dart';
import 'rsi_calculator.dart';

class RsiMethodDetector {
  const RsiMethodDetector({
    this.rsiCalculator = const RsiCalculator(),
    this.oversoldThreshold = 30.0,
    this.overboughtThreshold = 70.0,
    this.period = 14,
  });

  final RsiCalculator rsiCalculator;
  final double oversoldThreshold;
  final double overboughtThreshold;
  final int period;

  static const String methodName = 'RSI Method';

  /// Minimum candles needed: period + 2 (warmup + 2 bars for comparison).
  int get requiredCandles => period + 2;

  /// Evaluate for an RSI Method **BUY** signal.
  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // RSI exits oversold: RSI[t-1] < threshold AND RSI[t] >= threshold
    final isTriggered =
        data.previousRsi < oversoldThreshold &&
        data.currentRsi >= oversoldThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.rsiMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: RSI exited oversold '
                '(${data.previousRsi.toStringAsFixed(1)} → '
                '${data.currentRsi.toStringAsFixed(1)})'
          : null,
    );
  }

  /// Evaluate for an RSI Method **SELL** signal.
  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // RSI exits overbought: RSI[t-1] > threshold AND RSI[t] <= threshold
    final isTriggered =
        data.previousRsi > overboughtThreshold &&
        data.currentRsi <= overboughtThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.rsiMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: RSI exited overbought '
                '(${data.previousRsi.toStringAsFixed(1)} → '
                '${data.currentRsi.toStringAsFixed(1)})'
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

  _RsiBaseData? _computeBase(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = rsiCalculator.computeSeries(candles, period: period);

    // Need at least two non-null RSI values for comparison
    final currentRsi = series[series.length - 1].$2;
    final previousRsi = series[series.length - 2].$2;
    if (currentRsi == null || previousRsi == null) return null;

    return _RsiBaseData(currentRsi: currentRsi, previousRsi: previousRsi);
  }
}

class _RsiBaseData {
  const _RsiBaseData({required this.currentRsi, required this.previousRsi});

  final double currentRsi;
  final double previousRsi;
}
