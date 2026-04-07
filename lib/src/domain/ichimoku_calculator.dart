/// Ichimoku Cloud — Pure domain logic.
///
/// Tenkan-sen  = (highest high + lowest low) / 2 over [tenkanPeriod] (9)
/// Kijun-sen   = (highest high + lowest low) / 2 over [kijunPeriod] (26)
/// Senkou A    = (tenkan + kijun) / 2, plotted [displacement] ahead (26)
/// Senkou B    = (HH + LL) / 2 over [senkouBPeriod] (52), plotted ahead
/// Chikou Span = current close plotted [displacement] bars back
///
/// This calculator returns all five lines aligned to the candle index.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// A single Ichimoku data point.
class IchimokuResult extends Equatable {
  const IchimokuResult({
    required this.date,
    this.tenkan,
    this.kijun,
    this.senkouA,
    this.senkouB,
    this.chikou,
  });

  final DateTime date;
  final double? tenkan;
  final double? kijun;
  final double? senkouA;
  final double? senkouB;
  final double? chikou;

  @override
  List<Object?> get props => [date, tenkan, kijun, senkouA, senkouB, chikou];
}

/// Computes Ichimoku Cloud series for [DailyCandle] data.
class IchimokuCalculator {
  const IchimokuCalculator({
    this.tenkanPeriod = 9,
    this.kijunPeriod = 26,
    this.senkouBPeriod = 52,
    this.displacement = 26,
  });

  final int tenkanPeriod;
  final int kijunPeriod;
  final int senkouBPeriod;
  final int displacement;

  /// Compute the most recent Ichimoku value.
  IchimokuResult? compute(List<DailyCandle> candles) {
    final series = computeSeries(candles);
    return series.isEmpty ? null : series.last;
  }

  /// Compute a full Ichimoku series aligned with [candles].
  List<IchimokuResult> computeSeries(List<DailyCandle> candles) {
    if (candles.length < senkouBPeriod) return [];

    final int n = candles.length;
    final List<double?> tenkan = List.filled(n, null);
    final List<double?> kijun = List.filled(n, null);
    final List<double?> senkouA = List.filled(n, null);
    final List<double?> senkouB = List.filled(n, null);
    final List<double?> chikou = List.filled(n, null);

    // Tenkan-sen
    for (int i = tenkanPeriod - 1; i < n; i++) {
      tenkan[i] = _midpoint(candles, i - tenkanPeriod + 1, i);
    }

    // Kijun-sen
    for (int i = kijunPeriod - 1; i < n; i++) {
      kijun[i] = _midpoint(candles, i - kijunPeriod + 1, i);
    }

    // Senkou Span A and B — these would normally be plotted forward
    // but we store them at current indices (the "future" values)
    for (int i = kijunPeriod - 1; i < n; i++) {
      if (tenkan[i] != null && kijun[i] != null) {
        final int target = i + displacement;
        if (target < n) {
          senkouA[target] = (tenkan[i]! + kijun[i]!) / 2;
        }
      }
    }

    for (int i = senkouBPeriod - 1; i < n; i++) {
      final double mid = _midpoint(candles, i - senkouBPeriod + 1, i);
      final int target = i + displacement;
      if (target < n) {
        senkouB[target] = mid;
      }
    }

    // Chikou Span — close plotted [displacement] bars back
    for (int i = displacement; i < n; i++) {
      chikou[i - displacement] = candles[i].close;
    }

    final List<IchimokuResult> results = [];
    for (int i = 0; i < n; i++) {
      results.add(
        IchimokuResult(
          date: candles[i].date,
          tenkan: tenkan[i],
          kijun: kijun[i],
          senkouA: senkouA[i],
          senkouB: senkouB[i],
          chikou: chikou[i],
        ),
      );
    }
    return results;
  }

  double _midpoint(List<DailyCandle> candles, int start, int end) {
    double hh = candles[start].high;
    double ll = candles[start].low;
    for (int i = start + 1; i <= end; i++) {
      if (candles[i].high > hh) hh = candles[i].high;
      if (candles[i].low < ll) ll = candles[i].low;
    }
    return (hh + ll) / 2;
  }
}
