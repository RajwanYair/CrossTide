/// MACD Method Detector — Pure domain logic.
///
/// Uses standard MACD (12/26/9) to detect momentum crossover signals:
///
/// **BUY signal**: MACD line crosses above signal line.
///   macd[t-1] <= signal[t-1] AND macd[t] > signal[t]
///
/// **SELL signal**: MACD line crosses below signal line.
///   macd[t-1] >= signal[t-1] AND macd[t] < signal[t]
///
/// Follows the same [MethodSignal] pattern as [MichoMethodDetector].
library;

import 'entities.dart';
import 'macd_calculator.dart';
import 'micho_method_detector.dart';

class MacdMethodDetector {
  const MacdMethodDetector({this.macdCalculator = const MacdCalculator()});

  final MacdCalculator macdCalculator;

  static const String methodName = 'MACD Crossover';

  /// Minimum candles: slowPeriod(26) + signalPeriod(9) + 1 for comparison.
  static const int requiredCandles = 36;

  /// Evaluate for a MACD Method **BUY** signal.
  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // MACD crosses above signal
    final isTriggered =
        data.prevMacd <= data.prevSignal && data.currMacd > data.currSignal;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.macdMethodBuy,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'BUY: MACD crossed above signal '
                '(${data.currMacd.toStringAsFixed(2)} > '
                '${data.currSignal.toStringAsFixed(2)})'
          : null,
    );
  }

  /// Evaluate for a MACD Method **SELL** signal.
  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final data = _computeBase(candles);
    if (data == null) return null;

    // MACD crosses below signal
    final isTriggered =
        data.prevMacd >= data.prevSignal && data.currMacd < data.currSignal;

    return MethodSignal(
      ticker: ticker,
      methodName: methodName,
      alertType: AlertType.macdMethodSell,
      isTriggered: isTriggered,
      evaluatedAt: DateTime.now(),
      currentClose: candles.last.close,
      description: isTriggered
          ? 'SELL: MACD crossed below signal '
                '(${data.currMacd.toStringAsFixed(2)} < '
                '${data.currSignal.toStringAsFixed(2)})'
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

  _MacdBaseData? _computeBase(List<DailyCandle> candles) {
    if (candles.length < requiredCandles) return null;

    final series = macdCalculator.computeSeries(candles);

    // Find last two consecutive bars with complete MACD + Signal
    MacdResult? current;
    MacdResult? previous;
    for (int i = series.length - 1; i >= 1; i--) {
      if (series[i].macd != null &&
          series[i].signal != null &&
          series[i - 1].macd != null &&
          series[i - 1].signal != null) {
        current = series[i];
        previous = series[i - 1];
        break;
      }
    }
    if (current == null || previous == null) return null;

    return _MacdBaseData(
      currMacd: current.macd!,
      currSignal: current.signal!,
      prevMacd: previous.macd!,
      prevSignal: previous.signal!,
    );
  }
}

class _MacdBaseData {
  const _MacdBaseData({
    required this.currMacd,
    required this.currSignal,
    required this.prevMacd,
    required this.prevSignal,
  });

  final double currMacd;
  final double currSignal;
  final double prevMacd;
  final double prevSignal;
}
