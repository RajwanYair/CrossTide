/// Seasonality Analyzer — detects day-of-week and month-of-year
/// return patterns from historical candle data.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Average return for a named period (e.g. 'Monday', 'January').
class SeasonalReturn extends Equatable {
  const SeasonalReturn({
    required this.label,
    required this.averageReturnPct,
    required this.sampleCount,
    required this.positiveCount,
  });

  final String label;
  final double averageReturnPct;
  final int sampleCount;
  final int positiveCount;

  /// Win rate: fraction of periods with positive returns.
  double get winRate => sampleCount > 0 ? positiveCount / sampleCount : 0;

  @override
  List<Object?> get props => [
    label,
    averageReturnPct,
    sampleCount,
    positiveCount,
  ];
}

/// Full seasonality analysis result.
class SeasonalityResult extends Equatable {
  const SeasonalityResult({
    required this.ticker,
    required this.dayOfWeek,
    required this.monthOfYear,
  });

  final String ticker;

  /// Returns indexed by day name (Monday–Friday).
  final List<SeasonalReturn> dayOfWeek;

  /// Returns indexed by month name (January–December).
  final List<SeasonalReturn> monthOfYear;

  @override
  List<Object?> get props => [ticker, dayOfWeek, monthOfYear];
}

/// Analyzes seasonal patterns in returns.
class SeasonalityAnalyzer {
  const SeasonalityAnalyzer();

  static const _dayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  static const _monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  /// Analyze seasonal patterns for a ticker.
  SeasonalityResult analyze({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    // Daily returns
    final dayReturns = <int, List<double>>{};
    final monthReturns = <int, List<double>>{};

    for (int i = 1; i < candles.length; i++) {
      final DailyCandle prev = candles[i - 1];
      final DailyCandle curr = candles[i];
      if (prev.close == 0) continue;
      final ret = ((curr.close - prev.close) / prev.close) * 100;
      dayReturns.putIfAbsent(curr.date.weekday, () => []).add(ret);
      monthReturns.putIfAbsent(curr.date.month, () => []).add(ret);
    }

    final dayResults = <SeasonalReturn>[];
    for (int d = 1; d <= 7; d++) {
      final returns = dayReturns[d] ?? [];
      dayResults.add(_summarize(_dayNames[d - 1], returns));
    }

    final monthResults = <SeasonalReturn>[];
    for (int m = 1; m <= 12; m++) {
      final returns = monthReturns[m] ?? [];
      monthResults.add(_summarize(_monthNames[m - 1], returns));
    }

    return SeasonalityResult(
      ticker: ticker,
      dayOfWeek: dayResults,
      monthOfYear: monthResults,
    );
  }

  SeasonalReturn _summarize(String label, List<double> returns) {
    if (returns.isEmpty) {
      return SeasonalReturn(
        label: label,
        averageReturnPct: 0,
        sampleCount: 0,
        positiveCount: 0,
      );
    }
    var sum = 0.0;
    var positive = 0;
    for (final double r in returns) {
      sum += r;
      if (r > 0) positive++;
    }
    return SeasonalReturn(
      label: label,
      averageReturnPct: sum / returns.length,
      sampleCount: returns.length,
      positiveCount: positive,
    );
  }
}
