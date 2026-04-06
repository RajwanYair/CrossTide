/// CrossTide — Domain Entities
///
/// Pure value objects with no framework dependencies.
library;

import 'package:equatable/equatable.dart';

// ---------------------------------------------------------------------------
// SMA period enum — canonical set of supported moving-average periods
// ---------------------------------------------------------------------------

/// The SMA periods that CrossTide monitors.
enum SmaPeriod {
  sma50(50),
  sma150(150),
  sma200(200);

  const SmaPeriod(this.period);

  /// The numeric window size in trading days.
  final int period;

  /// How many candles are required (period + 1 for previous-bar comparison).
  int get requiredCandles => period + 1;

  String get label => 'SMA$period';
}

// ---------------------------------------------------------------------------
// Alert type enum — which cross-up events the user wants to be notified about
// ---------------------------------------------------------------------------

/// Determines which technical events trigger alerts for a ticker.
enum AlertType {
  /// Price crosses above SMA200.
  sma200CrossUp,

  /// Price crosses above SMA150.
  sma150CrossUp,

  /// Price crosses above SMA50.
  sma50CrossUp,

  /// SMA50 crosses above SMA200 (Golden Cross).
  goldenCross,

  /// SMA50 crosses below SMA200 (Death Cross).
  deathCross,
}

/// Extension helpers for [AlertType].
extension AlertTypeX on AlertType {
  String get displayName => switch (this) {
    AlertType.sma200CrossUp => 'SMA200 Cross-Up',
    AlertType.sma150CrossUp => 'SMA150 Cross-Up',
    AlertType.sma50CrossUp => 'SMA50 Cross-Up',
    AlertType.goldenCross => 'Golden Cross (50↑200)',
    AlertType.deathCross => 'Death Cross (50↓200)',
  };

  String get description => switch (this) {
    AlertType.sma200CrossUp =>
      'Price closes above the 200-day moving average',
    AlertType.sma150CrossUp =>
      'Price closes above the 150-day moving average',
    AlertType.sma50CrossUp =>
      'Price closes above the 50-day moving average',
    AlertType.goldenCross =>
      'SMA50 crosses above SMA200 — bullish long-term signal',
    AlertType.deathCross =>
      'SMA50 crosses below SMA200 — bearish long-term signal',
  };
}

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

/// Result of evaluating a ticker's cross-up status for a specific SMA period.
class CrossUpEvaluation extends Equatable {
  const CrossUpEvaluation({
    required this.ticker,
    required this.smaPeriod,
    required this.currentClose,
    required this.previousClose,
    required this.currentSma,
    required this.previousSma,
    required this.currentRelation,
    required this.isCrossUp,
    required this.isRising,
    required this.shouldAlert,
    required this.evaluatedAt,
  });

  final String ticker;

  /// Which SMA period this evaluation covers (50, 150, or 200).
  final SmaPeriod smaPeriod;

  final double currentClose;
  final double previousClose;

  /// Current SMA value for [smaPeriod].
  final double currentSma;

  /// Previous bar's SMA value for [smaPeriod].
  final double previousSma;

  final SmaRelation currentRelation;

  /// True when close[t-1] <= sma[t-1] AND close[t] > sma[t].
  final bool isCrossUp;

  /// True when close[t] > close[t-1] (or stricter multi-day trend).
  final bool isRising;

  /// True only when isCrossUp AND isRising AND not already alerted.
  final bool shouldAlert;

  final DateTime evaluatedAt;

  /// Convenience getter — SMA200 value (backwards-compat for code reading sma200).
  double get currentSma200 => smaPeriod == SmaPeriod.sma200
      ? currentSma
      : throw StateError('smaPeriod is $smaPeriod, not sma200');

  @override
  List<Object?> get props => [
    ticker,
    smaPeriod,
    currentClose,
    previousClose,
    currentSma,
    previousSma,
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
    this.enabledAlertTypes = const {AlertType.sma200CrossUp},
    this.sortOrder = 0,
    this.groupId,
  });

  final String symbol;
  final DateTime? addedAt;
  final DateTime? lastRefreshAt;
  final double? lastClose;
  final double? sma200;
  final TickerAlertState? alertState;
  final String? error;

  /// Which alert events the user wants for this ticker.
  final Set<AlertType> enabledAlertTypes;

  /// Sort position for drag-to-reorder (lower = higher in list).
  final int sortOrder;

  /// Optional watchlist group ID (null = ungrouped).
  final String? groupId;

  TickerEntry copyWith({
    DateTime? lastRefreshAt,
    double? lastClose,
    double? sma200,
    TickerAlertState? alertState,
    String? error,
    Set<AlertType>? enabledAlertTypes,
    int? sortOrder,
    String? groupId,
  }) {
    return TickerEntry(
      symbol: symbol,
      addedAt: addedAt,
      lastRefreshAt: lastRefreshAt ?? this.lastRefreshAt,
      lastClose: lastClose ?? this.lastClose,
      sma200: sma200 ?? this.sma200,
      alertState: alertState ?? this.alertState,
      error: error,
      enabledAlertTypes: enabledAlertTypes ?? this.enabledAlertTypes,
      sortOrder: sortOrder ?? this.sortOrder,
      groupId: groupId ?? this.groupId,
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
    enabledAlertTypes,
    sortOrder,
    groupId,
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
