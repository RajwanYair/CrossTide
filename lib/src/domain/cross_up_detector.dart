/// Cross-Up Detector — Pure domain logic.
///
/// Determines whether a stock has crossed above its SMA (any supported period)
/// while rising.
///
/// Cross-up definition (KEY RULE):
///   close[t-1] <= sma[t-1]  AND  close[t] > sma[t]
///
/// Rising definition (configurable):
///   Strictness 1: close[t] > close[t-1]
///   Strictness N: close[t] > close[t-1] > ... > close[t-N+1]
///                 (N consecutive days of higher closes)
library;

import 'entities.dart';
import 'sma_calculator.dart';

class CrossUpDetector {
  const CrossUpDetector({this.smaCalculator = const SmaCalculator()});

  final SmaCalculator smaCalculator;

  /// Evaluate a ticker for cross-up against [smaPeriod].
  ///
  /// Requires at least [smaPeriod.requiredCandles] candles for the SMA
  /// comparison (period + 1 bars), plus [trendStrictnessDays] extra for
  /// the rising check.
  ///
  /// [candles] must be sorted ascending by date.
  /// [previousState] is the last persisted alert state (for idempotency).
  /// [trendStrictnessDays] controls how many consecutive rising days are needed.
  ///
  /// Returns a [CrossUpEvaluation] describing the full result, or null if there
  /// isn't enough data.
  CrossUpEvaluation? evaluate({
    required String ticker,
    required List<DailyCandle> candles,
    required TickerAlertState previousState,
    SmaPeriod smaPeriod = SmaPeriod.sma200,
    int trendStrictnessDays = 1,
  }) {
    final period = smaPeriod.period;

    // Need at least period+1 candles to compare sma[t] vs sma[t-1].
    if (candles.length < period + 1) return null;

    final now = DateTime.now();

    // Current (t) and previous (t-1) candles
    final candleT = candles[candles.length - 1];
    final candleTm1 = candles[candles.length - 2];

    // SMA at t: uses last [period] candles
    final smaT = smaCalculator.compute(candles, period: period);
    if (smaT == null) return null;

    // SMA at t-1: uses preceding [period] candles
    final candlesForTm1 = candles.sublist(0, candles.length - 1);
    final smaTm1 = smaCalculator.compute(candlesForTm1, period: period);
    if (smaTm1 == null) return null;

    // Cross-up check: close[t-1] <= sma[t-1] AND close[t] > sma[t]
    final isCrossUp = candleTm1.close <= smaTm1 && candleT.close > smaT;

    // Rising check with configurable strictness
    final isRising = _checkRising(candles, trendStrictnessDays);

    // Current relation
    final currentRelation = candleT.close > smaT
        ? SmaRelation.above
        : SmaRelation.below;

    // Idempotent alert: only fire if cross-up AND rising AND not already alerted.
    final alreadyAlerted = previousState.lastStatus == SmaRelation.above;
    final shouldAlert = isCrossUp && isRising && !alreadyAlerted;

    return CrossUpEvaluation(
      ticker: ticker,
      smaPeriod: smaPeriod,
      currentClose: candleT.close,
      previousClose: candleTm1.close,
      currentSma: smaT,
      previousSma: smaTm1,
      currentRelation: currentRelation,
      isCrossUp: isCrossUp,
      isRising: isRising,
      shouldAlert: shouldAlert,
      evaluatedAt: now,
    );
  }

  /// Evaluate a ticker for ALL enabled [smaPeriods] in a single pass.
  ///
  /// Returns a map keyed by [SmaPeriod]. Periods for which there is
  /// insufficient data are omitted from the result.
  Map<SmaPeriod, CrossUpEvaluation> evaluateAll({
    required String ticker,
    required List<DailyCandle> candles,
    required TickerAlertState previousState,
    List<SmaPeriod> smaPeriods = SmaPeriod.values,
    int trendStrictnessDays = 1,
  }) {
    final results = <SmaPeriod, CrossUpEvaluation>{};
    for (final period in smaPeriods) {
      final eval = evaluate(
        ticker: ticker,
        candles: candles,
        previousState: previousState,
        smaPeriod: period,
        trendStrictnessDays: trendStrictnessDays,
      );
      if (eval != null) results[period] = eval;
    }
    return results;
  }

  /// Check if the last [days] closes form a strictly rising sequence.
  /// Requires candles.length >= days + 1.
  bool _checkRising(List<DailyCandle> candles, int days) {
    if (days < 1) return true;
    if (candles.length < days + 1) return false;

    for (var i = 0; i < days; i++) {
      final current = candles[candles.length - 1 - i];
      final previous = candles[candles.length - 2 - i];
      if (current.close <= previous.close) return false;
    }
    return true;
  }
}
