/// OBV Method Detector — Pure domain logic.
///
/// Detects OBV/Price divergence signals:
/// **BUY**: OBV rising over [lookback] while price is falling (bullish divergence).
/// **SELL**: OBV falling over [lookback] while price is rising (bearish divergence).
library;

import 'entities.dart';
import 'micho_method_detector.dart';
import 'obv_calculator.dart';

class ObvMethodDetector {
  const ObvMethodDetector({
    this.obvCalculator = const ObvCalculator(),
    this.lookback = 10,
  });

  final ObvCalculator obvCalculator;

  /// Number of bars to compare for divergence.
  final int lookback;

  static const String methodName = 'OBV Divergence';

  int get requiredCandles => lookback + 2;

  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // Bullish divergence: OBV rising, price falling
    final bool isTriggered = data.obvRising && data.priceFalling;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.obvMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: Bullish OBV divergence — OBV rising while price falling'
          : null,
    );
  }

  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    // Bearish divergence: OBV falling, price rising
    final bool isTriggered = data.obvFalling && data.priceRising;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.obvMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: Bearish OBV divergence — OBV falling while price rising'
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

  _ObvDivergence? _data(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final obvSeries = obvCalculator.computeSeries(candles);
    if (obvSeries.length < lookback + 1) return null;

    final int obvNow = obvSeries[obvSeries.length - 1].$2;
    final int obvPrev = obvSeries[obvSeries.length - 1 - lookback].$2;
    final double priceNow = candles[candles.length - 1].close;
    final double pricePrev = candles[candles.length - 1 - lookback].close;

    return _ObvDivergence(
      obvRising: obvNow > obvPrev,
      obvFalling: obvNow < obvPrev,
      priceRising: priceNow > pricePrev,
      priceFalling: priceNow < pricePrev,
    );
  }
}

class _ObvDivergence {
  const _ObvDivergence({
    required this.obvRising,
    required this.obvFalling,
    required this.priceRising,
    required this.priceFalling,
  });

  final bool obvRising;
  final bool obvFalling;
  final bool priceRising;
  final bool priceFalling;
}
