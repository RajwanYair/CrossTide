/// CCI Method Detector — Pure domain logic.
///
/// **BUY**: CCI crosses above −100 from below (exits oversold).
/// **SELL**: CCI crosses below +100 from above (exits overbought).
library;

import 'cci_calculator.dart';
import 'entities.dart';
import 'micho_method_detector.dart';

class CciMethodDetector {
  const CciMethodDetector({
    this.cciCalculator = const CciCalculator(),
    this.oversoldLevel = -100.0,
    this.overboughtLevel = 100.0,
    this.period = 20,
  });

  final CciCalculator cciCalculator;
  final double oversoldLevel;
  final double overboughtLevel;
  final int period;

  static const String methodName = 'CCI Method';

  int get requiredCandles => period + 2;

  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // CCI exits oversold: prev < −100 AND curr >= −100
    final bool isTriggered =
        data.prevCci < oversoldLevel && data.currCci >= oversoldLevel;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.cciMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: CCI exited oversold '
                '(${data.prevCci.toStringAsFixed(1)} → '
                '${data.currCci.toStringAsFixed(1)})'
          : null,
    );
  }

  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // CCI exits overbought: prev > 100 AND curr <= 100
    final bool isTriggered =
        data.prevCci > overboughtLevel && data.currCci <= overboughtLevel;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.cciMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: CCI exited overbought '
                '(${data.prevCci.toStringAsFixed(1)} → '
                '${data.currCci.toStringAsFixed(1)})'
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

  _CciPair? _data(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = cciCalculator.computeSeries(candles, period: period);

    final double? curr = series[series.length - 1].$2;
    final double? prev = series[series.length - 2].$2;
    if (curr == null || prev == null) return null;

    return _CciPair(currCci: curr, prevCci: prev);
  }
}

class _CciPair {
  const _CciPair({required this.currCci, required this.prevCci});

  final double currCci;
  final double prevCci;
}
