/// Win/Loss Streak Calculator — pure domain logic.
///
/// Analyzes a series of trade results (or daily returns) and
/// determines the longest winning and losing streaks.
library;

import 'package:equatable/equatable.dart';

/// Result of streak analysis.
class StreakResult extends Equatable {
  const StreakResult({
    required this.maxWinStreak,
    required this.maxLossStreak,
    required this.currentStreak,
    required this.currentStreakIsWin,
  });

  /// Longest consecutive winning period.
  final int maxWinStreak;

  /// Longest consecutive losing period.
  final int maxLossStreak;

  /// Length of the current (latest) streak.
  final int currentStreak;

  /// Whether the current streak is winning (true) or losing (false).
  final bool currentStreakIsWin;

  @override
  List<Object?> get props => [
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    currentStreakIsWin,
  ];
}

/// Computes win/loss streaks from a list of P&L values.
class WinLossStreakCalculator {
  const WinLossStreakCalculator();

  /// Compute streaks from [pnls] — a chronological list of profit/loss
  /// values. A value >= 0 is a win, < 0 is a loss.
  ///
  /// Returns null if [pnls] is empty.
  StreakResult? compute(List<double> pnls) {
    if (pnls.isEmpty) return null;

    int maxWin = 0;
    int maxLoss = 0;
    int currentStreak = 0;
    bool currentIsWin = pnls.first >= 0;

    for (final double pnl in pnls) {
      final bool isWin = pnl >= 0;
      if (isWin == currentIsWin) {
        currentStreak++;
      } else {
        currentStreak = 1;
        currentIsWin = isWin;
      }
      if (isWin && currentStreak > maxWin) {
        maxWin = currentStreak;
      } else if (!isWin && currentStreak > maxLoss) {
        maxLoss = currentStreak;
      }
    }

    return StreakResult(
      maxWinStreak: maxWin,
      maxLossStreak: maxLoss,
      currentStreak: currentStreak,
      currentStreakIsWin: currentIsWin,
    );
  }
}
