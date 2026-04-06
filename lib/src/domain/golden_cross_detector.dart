/// Golden Cross / Death Cross Detector — Pure domain logic.
///
/// Golden Cross: SMA50 crosses above SMA200 — classic long-term bullish signal.
/// Death Cross:  SMA50 crosses below SMA200 — classic long-term bearish signal.
///
/// Definition:
///   Golden Cross: sma50[t-1] <= sma200[t-1] AND sma50[t] > sma200[t]
///   Death Cross:  sma50[t-1] >= sma200[t-1] AND sma50[t] < sma200[t]
///
/// Requires at least 201 candles (so both sma200[t] and sma200[t-1] can be
/// computed via a 200-period window).
library;

import 'entities.dart';
import 'sma_calculator.dart';

/// Result of evaluating a Golden Cross or Death Cross event.
class CrossEvent {
  const CrossEvent({
    required this.ticker,
    required this.type,
    required this.currentSma50,
    required this.previousSma50,
    required this.currentSma200,
    required this.previousSma200,
    required this.isCrossEvent,
    required this.evaluatedAt,
  });

  final String ticker;

  /// [AlertType.goldenCross] or [AlertType.deathCross]
  final AlertType type;

  final double currentSma50;
  final double previousSma50;
  final double currentSma200;
  final double previousSma200;

  /// Whether the cross event occurred on this evaluation.
  final bool isCrossEvent;

  final DateTime evaluatedAt;
}

class GoldenCrossDetector {
  const GoldenCrossDetector({this.smaCalculator = const SmaCalculator()});

  final SmaCalculator smaCalculator;

  /// Evaluate for Golden Cross (SMA50 crossed above SMA200).
  ///
  /// Returns null when there is insufficient data (<201 candles).
  CrossEvent? evaluateGoldenCross({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    return _evaluate(
      ticker: ticker,
      candles: candles,
      type: AlertType.goldenCross,
    );
  }

  /// Evaluate for Death Cross (SMA50 crossed below SMA200).
  ///
  /// Returns null when there is insufficient data (<201 candles).
  CrossEvent? evaluateDeathCross({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    return _evaluate(
      ticker: ticker,
      candles: candles,
      type: AlertType.deathCross,
    );
  }

  /// Evaluate both Golden and Death Cross in one pass.
  ///
  /// Returns a list containing whichever events occurred (0–2 items).
  /// In practice only one cross can happen on a single day.
  List<CrossEvent> evaluateBoth({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final golden = evaluateGoldenCross(ticker: ticker, candles: candles);
    final death = evaluateDeathCross(ticker: ticker, candles: candles);
    return [?golden, ?death];
  }

  CrossEvent? _evaluate({
    required String ticker,
    required List<DailyCandle> candles,
    required AlertType type,
  }) {
    // Need 201 candles: sma200 at [t] uses 200 candles, sma200 at [t-1]
    // uses the preceding 200 candles, requiring 201 total.
    if (candles.length < 201) return null;

    final now = DateTime.now();

    // SMA200 at t and t-1
    final sma200T = smaCalculator.compute(candles, period: 200);
    if (sma200T == null) return null;
    final candlesTm1 = candles.sublist(0, candles.length - 1);
    final sma200Tm1 = smaCalculator.compute(candlesTm1, period: 200);
    if (sma200Tm1 == null) return null;

    // SMA50 at t and t-1 (needs only 50 candles, so always available if 201+ exist)
    final sma50T = smaCalculator.compute(candles, period: 50);
    if (sma50T == null) return null;
    final sma50Tm1 = smaCalculator.compute(candlesTm1, period: 50);
    if (sma50Tm1 == null) return null;

    final isCross = switch (type) {
      AlertType.goldenCross => sma50Tm1 <= sma200Tm1 && sma50T > sma200T,
      AlertType.deathCross => sma50Tm1 >= sma200Tm1 && sma50T < sma200T,
      _ => false,
    };

    return CrossEvent(
      ticker: ticker,
      type: type,
      currentSma50: sma50T,
      previousSma50: sma50Tm1,
      currentSma200: sma200T,
      previousSma200: sma200Tm1,
      isCrossEvent: isCross,
      evaluatedAt: now,
    );
  }
}
