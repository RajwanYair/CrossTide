/// MFI Method Detector — Pure domain logic.
///
/// Uses the 14-period Money Flow Index (volume-weighted RSI) to detect
/// reversal signals:
///
/// **BUY signal**: MFI exits oversold territory.
///   MFI[t-1] < 20 AND MFI[t] >= 20
///
/// **SELL signal**: MFI exits overbought territory.
///   MFI[t-1] > 80 AND MFI[t] <= 80
///
/// MFI oscillates between 0 and 100:
///   − Values below 20 are oversold.
///   − Values above 80 are overbought.
library;

import 'entities.dart';
import 'mfi_calculator.dart';
import 'micho_method_detector.dart';

class MfiMethodDetector {
  const MfiMethodDetector({
    this.mfiCalculator = const MfiCalculator(),
    this.oversoldThreshold = 20.0,
    this.overboughtThreshold = 80.0,
    this.period = 14,
  });

  final MfiCalculator mfiCalculator;
  final double oversoldThreshold;
  final double overboughtThreshold;
  final int period;

  static const String methodName = 'MFI Method';

  /// Minimum candles needed: period + 2 (warmup + 2 bars for comparison).
  int get requiredCandles => period + 2;

  /// Evaluate for an MFI Method **BUY** signal.
  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // MFI exits oversold: MFI[t-1] < threshold AND MFI[t] >= threshold
    final bool isTriggered =
        data.previousMfi < oversoldThreshold &&
        data.currentMfi >= oversoldThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.mfiMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: MFI exited oversold '
                '(${data.previousMfi.toStringAsFixed(1)} → '
                '${data.currentMfi.toStringAsFixed(1)})'
          : null,
    );
  }

  /// Evaluate for an MFI Method **SELL** signal.
  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // MFI exits overbought: MFI[t-1] > threshold AND MFI[t] <= threshold
    final bool isTriggered =
        data.previousMfi > overboughtThreshold &&
        data.currentMfi <= overboughtThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.mfiMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: MFI exited overbought '
                '(${data.previousMfi.toStringAsFixed(1)} → '
                '${data.currentMfi.toStringAsFixed(1)})'
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

  _MfiBase? _computeBase(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = mfiCalculator.computeSeries(candles, period: period);
    if (series.length < 2) return null;

    final double? currentMfi = series[series.length - 1].$2;
    final double? previousMfi = series[series.length - 2].$2;

    if (currentMfi == null || previousMfi == null) return null;

    return _MfiBase(currentMfi: currentMfi, previousMfi: previousMfi);
  }
}

class _MfiBase {
  const _MfiBase({required this.currentMfi, required this.previousMfi});
  final double currentMfi;
  final double previousMfi;
}
