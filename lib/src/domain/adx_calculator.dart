/// ADX (Average Directional Index) — Pure domain logic.
///
/// Measures trend strength (0–100) regardless of direction.
/// Uses +DI / −DI from smoothed directional movement and ATR.
/// Default period: 14.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'technical_defaults.dart';

/// A single ADX data point.
class AdxResult extends Equatable {
  const AdxResult({
    required this.date,
    required this.adx,
    required this.plusDi,
    required this.minusDi,
  });

  final DateTime date;

  /// ADX value (0–100). >25 = trending; <20 = ranging.
  final double adx;

  /// +DI (positive directional indicator).
  final double plusDi;

  /// −DI (negative directional indicator).
  final double minusDi;

  @override
  List<Object?> get props => [date, adx, plusDi, minusDi];
}

/// Computes the ADX series for [DailyCandle] data.
class AdxCalculator {
  const AdxCalculator();

  /// Compute the most recent ADX value.
  AdxResult? compute(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
  }) {
    final series = computeSeries(candles, period: period);
    return series.isEmpty ? null : series.last;
  }

  /// Compute a full ADX series.
  ///
  /// Requires at least [2 × period] candles for meaningful ADX output.
  List<AdxResult> computeSeries(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
  }) {
    // ADX needs period bars for DI smoothing + period bars for ADX smoothing
    if (candles.length < 2 * period) return [];

    // Step 1: True Range, +DM, −DM for each bar (starting at index 1)
    final List<double> trList = [];
    final List<double> plusDm = [];
    final List<double> minusDm = [];

    for (int i = 1; i < candles.length; i++) {
      final DailyCandle c = candles[i];
      final DailyCandle p = candles[i - 1];

      final double hl = c.high - c.low;
      final double hpc = (c.high - p.close).abs();
      final double lpc = (c.low - p.close).abs();
      double tr = hl;
      if (hpc > tr) tr = hpc;
      if (lpc > tr) tr = lpc;
      trList.add(tr);

      final double upMove = c.high - p.high;
      final double downMove = p.low - c.low;
      plusDm.add(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDm.add(downMove > upMove && downMove > 0 ? downMove : 0);
    }

    // Step 2: Wilder-smooth TR, +DM, −DM over [period]
    double smoothTr = 0;
    double smoothPlusDm = 0;
    double smoothMinusDm = 0;
    for (int i = 0; i < period; i++) {
      smoothTr += trList[i];
      smoothPlusDm += plusDm[i];
      smoothMinusDm += minusDm[i];
    }

    final List<double> dxList = [];

    double pdi = smoothTr > 0 ? (smoothPlusDm / smoothTr) * 100 : 0;
    double mdi = smoothTr > 0 ? (smoothMinusDm / smoothTr) * 100 : 0;
    double diSum = pdi + mdi;
    dxList.add(diSum > 0 ? ((pdi - mdi).abs() / diSum) * 100 : 0);

    final List<double> pdiList = [pdi];
    final List<double> mdiList = [mdi];

    for (int i = period; i < trList.length; i++) {
      smoothTr = smoothTr - smoothTr / period + trList[i];
      smoothPlusDm = smoothPlusDm - smoothPlusDm / period + plusDm[i];
      smoothMinusDm = smoothMinusDm - smoothMinusDm / period + minusDm[i];

      pdi = smoothTr > 0 ? (smoothPlusDm / smoothTr) * 100 : 0;
      mdi = smoothTr > 0 ? (smoothMinusDm / smoothTr) * 100 : 0;
      pdiList.add(pdi);
      mdiList.add(mdi);

      diSum = pdi + mdi;
      dxList.add(diSum > 0 ? ((pdi - mdi).abs() / diSum) * 100 : 0);
    }

    // Step 3: Smooth DX to get ADX (Wilder smoothing over [period])
    if (dxList.length < period) return [];

    double adx = 0;
    for (int i = 0; i < period; i++) {
      adx += dxList[i];
    }
    adx /= period;

    final List<AdxResult> results = [];
    // The first ADX value aligns with candle at index [2 * period - 1]
    results.add(
      AdxResult(
        date: candles[2 * period - 1].date,
        adx: adx,
        plusDi: pdiList[period - 1],
        minusDi: mdiList[period - 1],
      ),
    );

    for (int i = period; i < dxList.length; i++) {
      adx = (adx * (period - 1) + dxList[i]) / period;
      results.add(
        AdxResult(
          date: candles[i + period].date,
          adx: adx,
          plusDi: pdiList[i],
          minusDi: mdiList[i],
        ),
      );
    }
    return results;
  }
}
