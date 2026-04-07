/// Signal Confidence Calculator — multi-factor score for cross-up strength.
library;

import 'entities.dart';
import 'rsi_calculator.dart';
import 'sma_calculator.dart';

/// Computes a [SignalConfidenceScore] for a given ticker's candle history.
///
/// Each factor contributes 20 points to the 0–100 composite:
/// 1. Close > SMA200  (price is above key trend line)
/// 2. SMA50 > SMA200  (golden-cross formation)
/// 3. SMA50 > SMA150  (intermediate trend momentum)
/// 4. RSI(14) in 40–70  (healthy momentum, not overbought or oversold)
/// 5. Last volume > 1.5× 30-day average volume  (volume confirmation)
///
/// Requires at least 201 candles for SMA200 accuracy; returns score=0 with
/// all flags false when insufficient data is available.
class SignalConfidenceCalculator {
  const SignalConfidenceCalculator();

  static const _smaCalc = SmaCalculator();
  static const _rsiCalc = RsiCalculator();

  /// Compute the confidence score for [symbol] from [candles].
  SignalConfidenceScore compute(String symbol, List<DailyCandle> candles) {
    if (candles.length < 201) {
      return SignalConfidenceScore(
        symbol: symbol,
        score: 0,
        aboveSma200: false,
        goldenCrossForm: false,
        trendMomentum: false,
        rsiHealthy: false,
        volumeConfirm: false,
      );
    }

    final last = candles.last;

    // ---- SMA series ----
    final sma200Series = _smaCalc.computeSeries(candles, period: 200);
    final sma150Series = _smaCalc.computeSeries(candles, period: 150);
    final sma50Series = _smaCalc.computeSeries(candles, period: 50);

    final sma200 = sma200Series.last.$2;
    final sma150 = sma150Series.last.$2;
    final sma50 = sma50Series.last.$2;

    // ---- RSI ----
    final rsiSeries = _rsiCalc.computeSeries(candles, period: 14);
    final rsi = rsiSeries.last.$2;

    // ---- Volume (30-day average of prior bars) ----
    final lookback = candles.length >= 31 ? 31 : candles.length;
    final recent = candles.sublist(candles.length - lookback);
    final priorBars = recent.take(recent.length - 1).toList();
    final avgVolume = priorBars.isEmpty
        ? 0.0
        : priorBars.fold<double>(0, (acc, c) => acc + c.volume) /
              priorBars.length;

    // ---- Factor evaluation ----
    final aboveSma200 = sma200 != null && last.close > sma200;
    final goldenCrossForm = sma50 != null && sma200 != null && sma50 > sma200;
    final trendMomentum = sma50 != null && sma150 != null && sma50 > sma150;
    final rsiHealthy = rsi != null && rsi >= 40 && rsi <= 70;
    final volumeConfirm = avgVolume > 0 && last.volume > avgVolume * 1.5;

    final score =
        [
          aboveSma200,
          goldenCrossForm,
          trendMomentum,
          rsiHealthy,
          volumeConfirm,
        ].where((f) => f).length *
        20;

    return SignalConfidenceScore(
      symbol: symbol,
      score: score,
      aboveSma200: aboveSma200,
      goldenCrossForm: goldenCrossForm,
      trendMomentum: trendMomentum,
      rsiHealthy: rsiHealthy,
      volumeConfirm: volumeConfirm,
    );
  }
}
