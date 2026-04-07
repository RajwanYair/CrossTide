/// Parabolic SAR Method Detector — Pure domain logic.
///
/// **BUY**: SAR flips from downtrend (above price) to uptrend (below price).
/// **SELL**: SAR flips from uptrend (below price) to downtrend (above price).
library;

import 'entities.dart';
import 'micho_method_detector.dart';
import 'parabolic_sar_calculator.dart';

class SarMethodDetector {
  const SarMethodDetector({
    this.sarCalculator = const ParabolicSarCalculator(),
  });

  final ParabolicSarCalculator sarCalculator;

  static const String methodName = 'Parabolic SAR';

  int get requiredCandles => 5;

  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // SAR flips to uptrend: prev was down, curr is up
    final bool isTriggered = !data.prevIsUp && data.currIsUp;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.sarMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: SAR flipped bullish (SAR=${data.currSar.toStringAsFixed(2)})'
          : null,
    );
  }

  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // SAR flips to downtrend: prev was up, curr is down
    final bool isTriggered = data.prevIsUp && !data.currIsUp;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.sarMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: SAR flipped bearish (SAR=${data.currSar.toStringAsFixed(2)})'
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

  _SarPair? _data(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = sarCalculator.computeSeries(candles);
    if (series.length < 2) return null;

    final ParabolicSarResult curr = series[series.length - 1];
    final ParabolicSarResult prev = series[series.length - 2];

    return _SarPair(
      currSar: curr.sar,
      currIsUp: curr.isUpTrend,
      prevIsUp: prev.isUpTrend,
    );
  }
}

class _SarPair {
  const _SarPair({
    required this.currSar,
    required this.currIsUp,
    required this.prevIsUp,
  });

  final double currSar;
  final bool currIsUp;
  final bool prevIsUp;
}
