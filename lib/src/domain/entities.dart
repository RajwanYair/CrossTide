/// CrossTide — Domain Entities
///
/// Pure value objects with no framework dependencies.
library;

import 'package:equatable/equatable.dart';

/// A single daily price candle from the market data provider.
class DailyCandle extends Equatable {
  const DailyCandle({
    required this.date,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });

  final DateTime date;
  final double open;
  final double high;
  final double low;
  final double close;
  final int volume;

  @override
  List<Object?> get props => [date, open, high, low, close, volume];
}

/// Represents the current alert-evaluation state for a single ticker.
/// Persisted between refreshes to enforce idempotent alerting.
class TickerAlertState extends Equatable {
  const TickerAlertState({
    required this.ticker,
    required this.lastStatus,
    this.lastAlertedCrossUpAt,
    this.lastEvaluatedAt,
    this.lastCloseUsed,
    this.lastSma200,
  });

  final String ticker;

  /// Whether the ticker was above or below SMA200 at last evaluation.
  final SmaRelation lastStatus;

  /// Date of the most recent cross-up that triggered an alert.
  final DateTime? lastAlertedCrossUpAt;

  /// Timestamp of last evaluation run.
  final DateTime? lastEvaluatedAt;

  /// The close price used in the last evaluation.
  final double? lastCloseUsed;

  /// The SMA200 value used in the last evaluation.
  final double? lastSma200;

  TickerAlertState copyWith({
    SmaRelation? lastStatus,
    DateTime? lastAlertedCrossUpAt,
    DateTime? lastEvaluatedAt,
    double? lastCloseUsed,
    double? lastSma200,
  }) {
    return TickerAlertState(
      ticker: ticker,
      lastStatus: lastStatus ?? this.lastStatus,
      lastAlertedCrossUpAt: lastAlertedCrossUpAt ?? this.lastAlertedCrossUpAt,
      lastEvaluatedAt: lastEvaluatedAt ?? this.lastEvaluatedAt,
      lastCloseUsed: lastCloseUsed ?? this.lastCloseUsed,
      lastSma200: lastSma200 ?? this.lastSma200,
    );
  }

  @override
  List<Object?> get props => [
    ticker,
    lastStatus,
    lastAlertedCrossUpAt,
    lastEvaluatedAt,
    lastCloseUsed,
    lastSma200,
  ];
}

/// Relationship of close price to SMA200.
enum SmaRelation { above, below, unknown }

/// Result of evaluating a ticker's cross-up status.
class CrossUpEvaluation extends Equatable {
  const CrossUpEvaluation({
    required this.ticker,
    required this.currentClose,
    required this.previousClose,
    required this.currentSma200,
    required this.previousSma200,
    required this.currentRelation,
    required this.isCrossUp,
    required this.isRising,
    required this.shouldAlert,
    required this.evaluatedAt,
  });

  final String ticker;
  final double currentClose;
  final double previousClose;
  final double currentSma200;
  final double previousSma200;
  final SmaRelation currentRelation;

  /// True when close[t-1] <= sma200[t-1] AND close[t] > sma200[t].
  final bool isCrossUp;

  /// True when close[t] > close[t-1] (or stricter multi-day trend).
  final bool isRising;

  /// True only when isCrossUp AND isRising AND not already alerted.
  final bool shouldAlert;

  final DateTime evaluatedAt;

  @override
  List<Object?> get props => [
    ticker,
    currentClose,
    previousClose,
    currentSma200,
    previousSma200,
    currentRelation,
    isCrossUp,
    isRising,
    shouldAlert,
    evaluatedAt,
  ];
}

/// User-managed ticker entry.
class TickerEntry extends Equatable {
  const TickerEntry({
    required this.symbol,
    this.addedAt,
    this.lastRefreshAt,
    this.lastClose,
    this.sma200,
    this.alertState,
    this.error,
  });

  final String symbol;
  final DateTime? addedAt;
  final DateTime? lastRefreshAt;
  final double? lastClose;
  final double? sma200;
  final TickerAlertState? alertState;
  final String? error;

  TickerEntry copyWith({
    DateTime? lastRefreshAt,
    double? lastClose,
    double? sma200,
    TickerAlertState? alertState,
    String? error,
  }) {
    return TickerEntry(
      symbol: symbol,
      addedAt: addedAt,
      lastRefreshAt: lastRefreshAt ?? this.lastRefreshAt,
      lastClose: lastClose ?? this.lastClose,
      sma200: sma200 ?? this.sma200,
      alertState: alertState ?? this.alertState,
      error: error,
    );
  }

  @override
  List<Object?> get props => [
    symbol,
    addedAt,
    lastRefreshAt,
    lastClose,
    sma200,
    alertState,
    error,
  ];
}

/// Application-wide settings.
class AppSettings extends Equatable {
  const AppSettings({
    this.refreshIntervalMinutes = 60,
    this.quietHoursStart,
    this.quietHoursEnd,
    this.trendStrictnessDays = 1,
    this.providerName = 'yahoo_finance',
    this.cacheTtlMinutes = 30,
  });

  /// How often to check for new data (Android: constrained by WorkManager min ~15 min).
  final int refreshIntervalMinutes;

  /// Quiet hours: don't fire notifications during this window.
  /// Stored as hour-of-day (0-23). null = disabled.
  final int? quietHoursStart;
  final int? quietHoursEnd;

  /// Number of consecutive rising days required.
  /// 1 = close[t] > close[t-1].
  /// 2 = close[t] > close[t-1] > close[t-2], etc.
  final int trendStrictnessDays;

  /// Active market data provider identifier.
  final String providerName;

  /// Don't refetch if last fetch was within this TTL.
  final int cacheTtlMinutes;

  AppSettings copyWith({
    int? refreshIntervalMinutes,
    int? quietHoursStart,
    int? quietHoursEnd,
    int? trendStrictnessDays,
    String? providerName,
    int? cacheTtlMinutes,
  }) {
    return AppSettings(
      refreshIntervalMinutes:
          refreshIntervalMinutes ?? this.refreshIntervalMinutes,
      quietHoursStart: quietHoursStart ?? this.quietHoursStart,
      quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
      trendStrictnessDays: trendStrictnessDays ?? this.trendStrictnessDays,
      providerName: providerName ?? this.providerName,
      cacheTtlMinutes: cacheTtlMinutes ?? this.cacheTtlMinutes,
    );
  }

  @override
  List<Object?> get props => [
    refreshIntervalMinutes,
    quietHoursStart,
    quietHoursEnd,
    trendStrictnessDays,
    providerName,
    cacheTtlMinutes,
  ];
}

/// Preset alert-sensitivity profiles inspired by enterprise configuration
/// management patterns. Each profile pre-fills [AppSettings] with sensible
/// defaults. [custom] means the user has manually overridden individual fields.
enum AlertProfile { aggressive, balanced, conservative, custom }

/// Maps each [AlertProfile] to a ready-to-use [AppSettings] snapshot.
/// The UI can apply a profile in one tap; the user may then fine-tune
/// individual fields (which implicitly switches the profile to [custom]).
extension AlertProfileDefaults on AlertProfile {
  AppSettings get defaults {
    switch (this) {
      case AlertProfile.aggressive:
        // Frequent refresh, single-day trend confirmation — highest sensitivity.
        return const AppSettings(
          refreshIntervalMinutes: 15,
          trendStrictnessDays: 1,
          cacheTtlMinutes: 10,
        );
      case AlertProfile.balanced:
        // Default behaviour — hourly refresh, single-day confirmation.
        return const AppSettings(
          refreshIntervalMinutes: 60,
          trendStrictnessDays: 1,
          cacheTtlMinutes: 30,
        );
      case AlertProfile.conservative:
        // Fewer interruptions — 2-hour refresh, 3-day trend required.
        return const AppSettings(
          refreshIntervalMinutes: 120,
          trendStrictnessDays: 3,
          cacheTtlMinutes: 60,
        );
      case AlertProfile.custom:
        // Pass-through; caller supplies explicit AppSettings.
        return const AppSettings();
    }
  }

  String get displayName {
    switch (this) {
      case AlertProfile.aggressive:
        return 'Aggressive';
      case AlertProfile.balanced:
        return 'Balanced';
      case AlertProfile.conservative:
        return 'Conservative';
      case AlertProfile.custom:
        return 'Custom';
    }
  }

  String get description {
    switch (this) {
      case AlertProfile.aggressive:
        return 'Refresh every 15 min, alert on every cross-up';
      case AlertProfile.balanced:
        return 'Hourly refresh, single-day confirmation (default)';
      case AlertProfile.conservative:
        return '2-hour refresh, 3 consecutive rising days required';
      case AlertProfile.custom:
        return 'Manually configured';
    }
  }
}
