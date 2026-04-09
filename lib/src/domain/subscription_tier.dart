/// Subscription Tier — app licensing tiers and feature flag management.
library;

import 'package:equatable/equatable.dart';

/// Application subscription tier.
enum AppTier {
  /// Free tier — up to 10 tickers, core features only.
  free,

  /// Pro tier — up to 100 tickers, all standard features.
  pro,

  /// Enterprise tier — unlimited tickers, all features including AI and plugins.
  enterprise,
}

/// Features gated by subscription tier.
enum TierFeature {
  /// Remove the 10-ticker watchlist limit.
  unlimitedTickers,

  /// Use the custom indicator formula builder.
  customIndicators,

  /// Export full alert history to CSV/JSON.
  exportHistory,

  /// Enable the Prometheus scrape endpoint.
  prometheusEndpoint,

  /// Configure Telegram/Discord/Slack webhook sinks.
  webhooks,

  /// Access AI-powered signal confidence scores and pattern recognition.
  aiSignals,

  /// Load third-party indicator and handler plugins.
  pluginSystem,

  /// Priority customer support queue.
  prioritySupport,
}

/// The active subscription tier and its feature set.
class SubscriptionTier extends Equatable {
  const SubscriptionTier({
    required this.tier,
    required this.features,
    required this.maxTickers,
    this.expiresAt,
  });

  /// Free-tier defaults: 10-ticker limit, core features.
  factory SubscriptionTier.free() => const SubscriptionTier(
    tier: AppTier.free,
    features: {TierFeature.exportHistory},
    maxTickers: 10,
  );

  /// Pro-tier defaults: 100 tickers, most features.
  factory SubscriptionTier.pro({DateTime? expiresAt}) => SubscriptionTier(
    tier: AppTier.pro,
    features: const {
      TierFeature.unlimitedTickers,
      TierFeature.customIndicators,
      TierFeature.exportHistory,
      TierFeature.prometheusEndpoint,
      TierFeature.webhooks,
    },
    maxTickers: 100,
    expiresAt: expiresAt,
  );

  /// Enterprise-tier defaults: unlimited tickers, all features.
  factory SubscriptionTier.enterprise({DateTime? expiresAt}) => SubscriptionTier(
    tier: AppTier.enterprise,
    features: const {
      TierFeature.unlimitedTickers,
      TierFeature.customIndicators,
      TierFeature.exportHistory,
      TierFeature.prometheusEndpoint,
      TierFeature.webhooks,
      TierFeature.aiSignals,
      TierFeature.pluginSystem,
      TierFeature.prioritySupport,
    },
    maxTickers: -1,
    expiresAt: expiresAt,
  );

  final AppTier tier;

  /// Set of features unlocked at this tier.
  final Set<TierFeature> features;

  /// Maximum number of watchlist tickers. -1 means unlimited.
  final int maxTickers;

  /// Expiry timestamp — null means perpetual (or not yet set).
  final DateTime? expiresAt;

  /// Returns true when [feature] is unlocked for this tier.
  bool hasFeature(TierFeature feature) => features.contains(feature);

  /// Returns true at [now] if the tier is not yet expired.
  bool isActiveAt(DateTime now) =>
      expiresAt == null || expiresAt!.isAfter(now);

  @override
  List<Object?> get props => [tier, features, maxTickers, expiresAt];
}
