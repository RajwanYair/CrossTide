import 'package:equatable/equatable.dart';

/// Tier classification for a market data provider.
enum DataProviderTier {
  /// Free tier — limited requests per day.
  free,

  /// Basic paid tier.
  basic,

  /// Professional tier with higher rate limits.
  professional,

  /// Enterprise tier with SLA guarantees.
  enterprise,
}

/// Configuration for a market data provider integration.
class DataProviderConfig extends Equatable {
  /// Creates a [DataProviderConfig].
  const DataProviderConfig({
    required this.providerId,
    required this.providerName,
    required this.baseUrl,
    required this.tier,
    required this.rateLimitPerMinute,
    this.isEnabled = true,
  });

  /// Unique identifier for this provider.
  final String providerId;

  /// Human-readable provider name (e.g. `'Yahoo Finance'`).
  final String providerName;

  /// Base URL for the provider's API.
  final String baseUrl;

  /// Subscription tier.
  final DataProviderTier tier;

  /// Maximum number of API requests allowed per minute.
  final int rateLimitPerMinute;

  /// Whether this provider is currently active in the app.
  final bool isEnabled;

  /// Returns `true` when the provider is on a paid tier.
  bool get isPaidTier => tier != DataProviderTier.free;

  /// Returns `true` when the rate limit is ≥ 100 req/min.
  bool get isHighThroughput => rateLimitPerMinute >= 100;

  @override
  List<Object?> get props => [
    providerId,
    providerName,
    baseUrl,
    tier,
    rateLimitPerMinute,
    isEnabled,
  ];
}
