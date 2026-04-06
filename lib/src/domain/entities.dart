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

  /// Price reaches or exceeds a user-defined target.
  priceTarget,

  /// Price moves by a set percentage from the previous close (up or down).
  pctMove,

  /// Today's volume is ≥ N× the rolling 20-day average volume.
  volumeSpike,
}

/// Extension helpers for [AlertType].
extension AlertTypeX on AlertType {
  String get displayName => switch (this) {
    AlertType.sma200CrossUp => 'SMA200 Cross-Up',
    AlertType.sma150CrossUp => 'SMA150 Cross-Up',
    AlertType.sma50CrossUp => 'SMA50 Cross-Up',
    AlertType.goldenCross => 'Golden Cross (50↑200)',
    AlertType.deathCross => 'Death Cross (50↓200)',
    AlertType.priceTarget => 'Price Target',
    AlertType.pctMove => '% Move Alert',
    AlertType.volumeSpike => 'Volume Spike',
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
    AlertType.priceTarget =>
      'Price reaches or exceeds your target price',
    AlertType.pctMove =>
      'Price moves ≥ N% from the previous session close',
    AlertType.volumeSpike =>
      'Today\'s volume is ≥ N× the 20-day average volume',
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
    this.nextEarningsAt,
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

  /// Next expected earnings date (from Yahoo Finance quoteSummary, nullable).
  final DateTime? nextEarningsAt;

  /// True if the next earnings event is within [days] calendar days from [now].
  bool isEarningsSoon({int days = 7, DateTime? now}) {
    if (nextEarningsAt == null) return false;
    final today = (now ?? DateTime.now()).toLocal();
    final diff = nextEarningsAt!.toLocal().difference(today).inDays;
    return diff >= 0 && diff <= days;
  }

  TickerEntry copyWith({
    DateTime? lastRefreshAt,
    double? lastClose,
    double? sma200,
    TickerAlertState? alertState,
    String? error,
    Set<AlertType>? enabledAlertTypes,
    int? sortOrder,
    String? groupId,
    DateTime? nextEarningsAt,
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
      nextEarningsAt: nextEarningsAt ?? this.nextEarningsAt,
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
    nextEarningsAt,
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
    this.advancedMode = false,
    this.defaultIndicators = const [],
    this.volumeSpikeMultiplier = 2.0,
    this.accentColorValue = 0xFF0D47A1,
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

  /// When true, show SMA values, sector tags, and technical indicators.
  /// When false, show a simplified view for novice users.
  final bool advancedMode;

  /// Default indicators to show on the chart (e.g. 'EMA:20', 'RSI:14', 'MACD', 'BB').
  final List<String> defaultIndicators;

  /// Multiplier for volume spike alerts (e.g. 2.0 = 2x avg daily volume).
  final double volumeSpikeMultiplier;

  /// ARGB int for the app accent seed color (e.g. 0xFF0D47A1 = deep blue).
  final int accentColorValue;

  AppSettings copyWith({
    int? refreshIntervalMinutes,
    int? quietHoursStart,
    int? quietHoursEnd,
    int? trendStrictnessDays,
    String? providerName,
    int? cacheTtlMinutes,
    bool? advancedMode,
    List<String>? defaultIndicators,
    double? volumeSpikeMultiplier,
    int? accentColorValue,
  }) {
    return AppSettings(
      refreshIntervalMinutes:
          refreshIntervalMinutes ?? this.refreshIntervalMinutes,
      quietHoursStart: quietHoursStart ?? this.quietHoursStart,
      quietHoursEnd: quietHoursEnd ?? this.quietHoursEnd,
      trendStrictnessDays: trendStrictnessDays ?? this.trendStrictnessDays,
      providerName: providerName ?? this.providerName,
      cacheTtlMinutes: cacheTtlMinutes ?? this.cacheTtlMinutes,
      advancedMode: advancedMode ?? this.advancedMode,
      defaultIndicators: defaultIndicators ?? this.defaultIndicators,
      volumeSpikeMultiplier:
          volumeSpikeMultiplier ?? this.volumeSpikeMultiplier,
      accentColorValue: accentColorValue ?? this.accentColorValue,
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
    advancedMode,
    defaultIndicators,
    volumeSpikeMultiplier,
    accentColorValue,
  ];
}

/// Preset alert-sensitivity profiles inspired by enterprise configuration
/// management patterns. Each profile pre-fills [AppSettings] with sensible
/// defaults. [custom] means the user has manually overridden individual fields.
enum AlertProfile { aggressive, balanced, conservative, custom }

/// A user-defined percentage-move threshold for a ticker.
/// Fires when |close / prevClose - 1| × 100 ≥ thresholdPct.
class PctMoveThreshold extends Equatable {
  const PctMoveThreshold({
    this.id,
    required this.symbol,
    required this.thresholdPct,
    this.note,
    this.createdAt,
  });

  final int? id;
  final String symbol;
  /// Minimum absolute percentage move to trigger (e.g. 5.0 = 5%).
  final double thresholdPct;
  final String? note;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [id, symbol, thresholdPct, note, createdAt];
}

/// A user-defined price target for a ticker.
class PriceTarget extends Equatable {
  const PriceTarget({
    this.id,
    required this.symbol,
    required this.targetPrice,
    this.note,
    this.createdAt,
    this.firedAt,
  });

  /// Database row ID; null when not yet persisted.
  final int? id;
  final String symbol;
  final double targetPrice;
  final String? note;
  final DateTime? createdAt;
  /// Set when the alert has fired (price crossed target). Null = still pending.
  final DateTime? firedAt;

  bool get hasFired => firedAt != null;

  @override
  List<Object?> get props => [id, symbol, targetPrice, note, createdAt, firedAt];
}

/// A single entry in the alert history (append-only fired-alert log).
class AlertHistoryEntry extends Equatable {
  const AlertHistoryEntry({
    this.id,
    required this.symbol,
    required this.alertType,
    required this.message,
    required this.firedAt,
    this.acknowledged = false,
  });

  final int? id;
  final String symbol;

  /// Matches [AlertType.name], e.g. 'sma200CrossUp', 'priceTarget'.
  final String alertType;
  final String message;
  final DateTime firedAt;
  final bool acknowledged;

  @override
  List<Object?> get props => [
    id,
    symbol,
    alertType,
    message,
    firedAt,
    acknowledged,
  ];
}

// ---------------------------------------------------------------------------
// AlertSensitivityStats — computed from AlertHistory
// ---------------------------------------------------------------------------

/// Summary statistics for a single ticker's alert history.
///
/// Computed on-the-fly from [AlertHistoryEntry] records stored in the DB.
/// Not persisted — derived on read.
class AlertSensitivityStats extends Equatable {
  const AlertSensitivityStats({
    required this.symbol,
    required this.totalAlerts,
    this.firstFiredAt,
    this.lastFiredAt,
    this.avgDaysBetweenAlerts,
    required this.alertsByType,
  });

  final String symbol;

  /// Total number of alerts ever fired for this symbol.
  final int totalAlerts;

  final DateTime? firstFiredAt;
  final DateTime? lastFiredAt;

  /// Mean days between consecutive alert events (null when < 2 events).
  final double? avgDaysBetweenAlerts;

  /// Per-[alertType] counts, e.g. `{'sma200CrossUp': 3, 'goldenCross': 1}`.
  final Map<String, int> alertsByType;

  /// Computes [AlertSensitivityStats] from a list of history entries.
  static AlertSensitivityStats fromHistory(
    String symbol,
    List<AlertHistoryEntry> entries,
  ) {
    if (entries.isEmpty) {
      return AlertSensitivityStats(
        symbol: symbol,
        totalAlerts: 0,
        alertsByType: const {},
      );
    }

    final sorted = [...entries]..sort((a, b) => a.firedAt.compareTo(b.firedAt));

    double? avg;
    if (sorted.length >= 2) {
      final gaps = <double>[];
      for (var i = 1; i < sorted.length; i++) {
        gaps.add(
          sorted[i].firedAt
              .difference(sorted[i - 1].firedAt)
              .inHours /
              24.0,
        );
      }
      avg = gaps.reduce((a, b) => a + b) / gaps.length;
    }

    final byType = <String, int>{};
    for (final e in entries) {
      byType[e.alertType] = (byType[e.alertType] ?? 0) + 1;
    }

    return AlertSensitivityStats(
      symbol: symbol,
      totalAlerts: entries.length,
      firstFiredAt: sorted.first.firedAt,
      lastFiredAt: sorted.last.firedAt,
      avgDaysBetweenAlerts: avg,
      alertsByType: Map.unmodifiable(byType),
    );
  }

  @override
  List<Object?> get props => [
    symbol,
    totalAlerts,
    firstFiredAt,
    lastFiredAt,
    avgDaysBetweenAlerts,
    alertsByType,
  ];
}

// ---------------------------------------------------------------------------
// AuditLogEntry — records user-initiated settings changes
// ---------------------------------------------------------------------------

/// A single entry in the audit log recording a settings change.
class AuditLogEntry extends Equatable {
  const AuditLogEntry({
    this.id,
    required this.timestamp,
    required this.field,
    required this.oldValue,
    required this.newValue,
    this.screen = '',
  });

  final int? id;
  final DateTime timestamp;

  /// The settings field that changed (e.g. 'refreshIntervalMinutes').
  final String field;

  /// The previous value as a display string.
  final String oldValue;

  /// The new value as a display string.
  final String newValue;

  /// The screen or context where the change was made.
  final String screen;

  @override
  List<Object?> get props => [id, timestamp, field, oldValue, newValue, screen];
}

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

  /// Returns a map of field → (currentValue, profileValue) for every setting
  /// that would change if the user applied this profile to [current].
  ///
  /// An empty map means the current settings already match this profile.
  /// Only fields that differ are included.
  Map<String, (String current, String incoming)> previewDiff(
    AppSettings current,
  ) {
    final target = defaults;
    final result = <String, (String, String)>{};

    void check(String field, Object? c, Object? t) {
      if (c?.toString() != t?.toString()) {
        result[field] = (c?.toString() ?? '', t?.toString() ?? '');
      }
    }

    check(
      'refreshIntervalMinutes',
      current.refreshIntervalMinutes,
      target.refreshIntervalMinutes,
    );
    check(
      'trendStrictnessDays',
      current.trendStrictnessDays,
      target.trendStrictnessDays,
    );
    check('cacheTtlMinutes', current.cacheTtlMinutes, target.cacheTtlMinutes);
    check('advancedMode', current.advancedMode, target.advancedMode);
    check(
      'volumeSpikeMultiplier',
      current.volumeSpikeMultiplier,
      target.volumeSpikeMultiplier,
    );
    return result;
  }
}

// ---------------------------------------------------------------------------
// IntradayQuote — real-time price snapshot
// ---------------------------------------------------------------------------

/// Real-time quote snapshot fetched from Yahoo Finance (1-minute chart).
///
/// Since this is ephemeral display data it is NOT stored in the database.
/// TTL is enforced by the UI layer (discard after 2 minutes).
class IntradayQuote extends Equatable {
  const IntradayQuote({
    required this.symbol,
    required this.price,
    required this.fetchedAt,
    this.prevClose,
    this.change,
    this.changePct,
    this.marketState = 'CLOSED',
    this.preMarketPrice,
    this.postMarketPrice,
  });

  final String symbol;
  final double price;
  final double? prevClose;
  final double? change;
  final double? changePct;

  /// Yahoo market state: 'PRE', 'REGULAR', 'POST', 'CLOSED'.
  final String marketState;

  final double? preMarketPrice;
  final double? postMarketPrice;
  final DateTime fetchedAt;

  bool get isPreMarket => marketState == 'PRE';
  bool get isRegularHours => marketState == 'REGULAR';
  bool get isAfterHours => marketState == 'POST';

  /// Whether this quote is stale (fetched more than [ttlMinutes] ago).
  bool isStale({int ttlMinutes = 2}) =>
      DateTime.now().difference(fetchedAt).inMinutes >= ttlMinutes;

  @override
  List<Object?> get props => [
    symbol,
    price,
    prevClose,
    change,
    changePct,
    marketState,
    preMarketPrice,
    postMarketPrice,
    fetchedAt,
  ];
}

