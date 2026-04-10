import 'package:equatable/equatable.dart';

/// Tracks alert budget consumption for a ticker or globally.
class AlertBudgetTracker extends Equatable {
  const AlertBudgetTracker({
    required this.trackerId,
    required this.ticker,
    required this.dailyLimit,
    required this.weeklyLimit,
    required this.alertsToday,
    required this.alertsThisWeek,
    required this.resetAt,
  });

  final String trackerId;

  /// Ticker symbol, or '*' for global budget.
  final String ticker;

  /// Maximum alerts allowed per day (0 = unlimited).
  final int dailyLimit;

  /// Maximum alerts allowed per week (0 = unlimited).
  final int weeklyLimit;

  final int alertsToday;
  final int alertsThisWeek;

  /// Timestamp when the daily counter resets.
  final DateTime resetAt;

  /// Returns true when daily budget is exhausted.
  bool get isDailyExhausted => dailyLimit > 0 && alertsToday >= dailyLimit;

  /// Returns true when weekly budget is exhausted.
  bool get isWeeklyExhausted =>
      weeklyLimit > 0 && alertsThisWeek >= weeklyLimit;

  /// Returns true when either daily or weekly budget is exhausted.
  bool get isExhausted => isDailyExhausted || isWeeklyExhausted;

  /// Remaining daily alerts. Returns null when unlimited.
  int? get remainingToday =>
      dailyLimit > 0 ? (dailyLimit - alertsToday).clamp(0, dailyLimit) : null;

  @override
  List<Object?> get props => [
    trackerId,
    ticker,
    dailyLimit,
    weeklyLimit,
    alertsToday,
    alertsThisWeek,
    resetAt,
  ];
}
