/// Signal Streak Analyzer — counts consecutive BUY/SELL signals
/// across time to identify persistent trends or inflection points.
library;

import 'package:equatable/equatable.dart';

/// Direction of a signal streak.
enum StreakDirection { buy, sell, none }

/// A streak of consecutive signals in one direction.
class SignalStreak extends Equatable {
  const SignalStreak({
    required this.direction,
    required this.length,
    required this.startDate,
    required this.endDate,
    required this.methods,
  });

  final StreakDirection direction;

  /// Number of consecutive periods in this direction.
  final int length;

  /// Start date of the streak.
  final DateTime startDate;

  /// End date of the streak.
  final DateTime endDate;

  /// Methods that contributed to the streak.
  final Set<String> methods;

  @override
  List<Object?> get props => [direction, length, startDate, endDate, methods];
}

/// Result of streak analysis for a ticker.
class StreakAnalysisResult extends Equatable {
  const StreakAnalysisResult({
    required this.ticker,
    required this.currentStreak,
    required this.longestBuyStreak,
    required this.longestSellStreak,
    required this.totalStreaks,
  });

  final String ticker;
  final SignalStreak currentStreak;
  final SignalStreak longestBuyStreak;
  final SignalStreak longestSellStreak;

  /// Total number of streaks found.
  final int totalStreaks;

  @override
  List<Object?> get props => [
    ticker,
    currentStreak,
    longestBuyStreak,
    longestSellStreak,
    totalStreaks,
  ];
}

/// Input: a dated signal entry with direction and method name.
class DatedSignal extends Equatable {
  const DatedSignal({
    required this.date,
    required this.direction,
    required this.method,
  });

  final DateTime date;
  final StreakDirection direction;
  final String method;

  @override
  List<Object?> get props => [date, direction, method];
}

/// Analyzes signal streaks from a time-ordered list of signals.
class SignalStreakAnalyzer {
  const SignalStreakAnalyzer();

  /// Analyze streaks for a ticker.
  StreakAnalysisResult analyze({
    required String ticker,
    required List<DatedSignal> signals,
  }) {
    if (signals.isEmpty) {
      return StreakAnalysisResult(
        ticker: ticker,
        currentStreak: _emptyStreak(),
        longestBuyStreak: _emptyStreak(),
        longestSellStreak: _emptyStreak(),
        totalStreaks: 0,
      );
    }

    final sorted = signals.toList()
      ..sort((DatedSignal a, DatedSignal b) => a.date.compareTo(b.date));

    final streaks = <SignalStreak>[];
    var currentDir = sorted.first.direction;
    var startIdx = 0;
    var methods = <String>{sorted.first.method};

    for (int i = 1; i < sorted.length; i++) {
      if (sorted[i].direction != currentDir) {
        streaks.add(
          SignalStreak(
            direction: currentDir,
            length: i - startIdx,
            startDate: sorted[startIdx].date,
            endDate: sorted[i - 1].date,
            methods: methods,
          ),
        );
        currentDir = sorted[i].direction;
        startIdx = i;
        methods = <String>{sorted[i].method};
      } else {
        methods.add(sorted[i].method);
      }
    }

    // Final streak
    final lastStreak = SignalStreak(
      direction: currentDir,
      length: sorted.length - startIdx,
      startDate: sorted[startIdx].date,
      endDate: sorted.last.date,
      methods: methods,
    );
    streaks.add(lastStreak);

    var longestBuy = _emptyStreak();
    var longestSell = _emptyStreak();

    for (final SignalStreak s in streaks) {
      if (s.direction == StreakDirection.buy && s.length > longestBuy.length) {
        longestBuy = s;
      }
      if (s.direction == StreakDirection.sell &&
          s.length > longestSell.length) {
        longestSell = s;
      }
    }

    return StreakAnalysisResult(
      ticker: ticker,
      currentStreak: lastStreak,
      longestBuyStreak: longestBuy,
      longestSellStreak: longestSell,
      totalStreaks: streaks.length,
    );
  }

  SignalStreak _emptyStreak() => SignalStreak(
    direction: StreakDirection.none,
    length: 0,
    startDate: DateTime(1970),
    endDate: DateTime(1970),
    methods: const {},
  );
}
