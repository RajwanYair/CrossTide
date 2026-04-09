/// Account Tier — defines feature access levels and limits per subscription plan.
library;

import 'package:equatable/equatable.dart';

/// Subscription plan levels.
enum TierPlan {
  /// Free tier — limited tickers and features.
  free,

  /// Pro tier — expanded limits, streaming quotes, multi-device sync.
  pro,

  /// Enterprise tier — unlimited tickers, all features, priority support.
  enterprise,
}

/// Defines what features and limits are available for a given [TierPlan].
class AccountTier extends Equatable {
  const AccountTier({
    required this.plan,
    required this.maxWatchlistTickers,
    required this.maxAlertRules,
    required this.hasStreamingQuotes,
    required this.hasMultiDeviceSync,
    required this.hasCustomIndicators,
    required this.hasCsvExport,
    required this.hasPdfReports,
    required this.hasEmailDigest,
    required this.hasPrioritySupport,
  });

  /// Free plan: 10 tickers, 5 alert rules, no premium features.
  factory AccountTier.free() => const AccountTier(
        plan: TierPlan.free,
        maxWatchlistTickers: 10,
        maxAlertRules: 5,
        hasStreamingQuotes: false,
        hasMultiDeviceSync: false,
        hasCustomIndicators: false,
        hasCsvExport: true,
        hasPdfReports: false,
        hasEmailDigest: false,
        hasPrioritySupport: false,
      );

  /// Pro plan: 100 tickers, 50 rules, streaming + sync + custom indicators.
  factory AccountTier.pro() => const AccountTier(
        plan: TierPlan.pro,
        maxWatchlistTickers: 100,
        maxAlertRules: 50,
        hasStreamingQuotes: true,
        hasMultiDeviceSync: true,
        hasCustomIndicators: true,
        hasCsvExport: true,
        hasPdfReports: true,
        hasEmailDigest: true,
        hasPrioritySupport: false,
      );

  /// Enterprise plan: unlimited tickers and rules, all features.
  factory AccountTier.enterprise() => const AccountTier(
        plan: TierPlan.enterprise,
        maxWatchlistTickers: -1,
        maxAlertRules: -1,
        hasStreamingQuotes: true,
        hasMultiDeviceSync: true,
        hasCustomIndicators: true,
        hasCsvExport: true,
        hasPdfReports: true,
        hasEmailDigest: true,
        hasPrioritySupport: true,
      );

  final TierPlan plan;

  /// Maximum watchlist tickers. -1 means unlimited.
  final int maxWatchlistTickers;

  /// Maximum alert rules. -1 means unlimited.
  final int maxAlertRules;

  final bool hasStreamingQuotes;
  final bool hasMultiDeviceSync;
  final bool hasCustomIndicators;
  final bool hasCsvExport;
  final bool hasPdfReports;
  final bool hasEmailDigest;
  final bool hasPrioritySupport;

  /// Whether there is no cap on watchlist tickers.
  bool get isUnlimited => maxWatchlistTickers < 0;

  /// Returns true if [currentCount] is below the plan's ticker limit.
  bool canAddTicker(int currentCount) =>
      isUnlimited || currentCount < maxWatchlistTickers;

  @override
  List<Object?> get props => [
        plan,
        maxWatchlistTickers,
        maxAlertRules,
        hasStreamingQuotes,
        hasMultiDeviceSync,
        hasCustomIndicators,
        hasCsvExport,
        hasPdfReports,
        hasEmailDigest,
        hasPrioritySupport,
      ];
}
