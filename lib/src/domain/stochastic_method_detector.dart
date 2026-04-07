/// Stochastic Method Detector — Pure domain logic.
///
/// **BUY**: %K crosses above %D while both are below [oversoldThreshold] (20).
/// **SELL**: %K crosses below %D while both are above [overboughtThreshold] (80).
library;

import 'entities.dart';
import 'micho_method_detector.dart';
import 'stochastic_calculator.dart';

class StochasticMethodDetector {
  const StochasticMethodDetector({
    this.stochasticCalculator = const StochasticCalculator(),
    this.oversoldThreshold = 20.0,
    this.overboughtThreshold = 80.0,
    this.period = 14,
    this.smoothK = 3,
    this.smoothD = 3,
  });

  final StochasticCalculator stochasticCalculator;
  final double oversoldThreshold;
  final double overboughtThreshold;
  final int period;
  final int smoothK;
  final int smoothD;

  static const String methodName = 'Stochastic Method';

  int get requiredCandles => period + smoothK + smoothD;

  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    final bool isTriggered =
        data.prevK <= data.prevD &&
        data.currK > data.currD &&
        data.currK < oversoldThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.stochasticMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: %%K crossed above %%D in oversold zone '
                '(K=${data.currK.toStringAsFixed(1)}, '
                'D=${data.currD.toStringAsFixed(1)})'
          : null,
    );
  }

  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _data(candles);
    if (data == null) return null;

    final bool isTriggered =
        data.prevK >= data.prevD &&
        data.currK < data.currD &&
        data.currK > overboughtThreshold;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.stochasticMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: %%K crossed below %%D in overbought zone '
                '(K=${data.currK.toStringAsFixed(1)}, '
                'D=${data.currD.toStringAsFixed(1)})'
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

  _StochData? _data(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = stochasticCalculator.computeSeries(
      candles,
      period: period,
      smoothK: smoothK,
      smoothD: smoothD,
    );
    if (series.length < 2) return null;

    final StochasticResult curr = series[series.length - 1];
    final StochasticResult prev = series[series.length - 2];

    return _StochData(
      currK: curr.percentK,
      currD: curr.percentD,
      prevK: prev.percentK,
      prevD: prev.percentD,
    );
  }
}

class _StochData {
  const _StochData({
    required this.currK,
    required this.currD,
    required this.prevK,
    required this.prevD,
  });

  final double currK;
  final double currD;
  final double prevK;
  final double prevD;
}
