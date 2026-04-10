import 'package:equatable/equatable.dart';

/// Standard market-capitalization category thresholds (USD).
enum MarketCapCategory {
  nano,
  micro,
  small,
  mid,
  large,
  mega;

  /// Minimum market cap in USD (inclusive lower bound).
  double get minUsd => switch (this) {
    MarketCapCategory.nano => 0,
    MarketCapCategory.micro => 50_000_000,
    MarketCapCategory.small => 300_000_000,
    MarketCapCategory.mid => 2_000_000_000,
    MarketCapCategory.large => 10_000_000_000,
    MarketCapCategory.mega => 200_000_000_000,
  };

  /// Maximum market cap in USD (exclusive upper bound), or null for mega.
  double? get maxUsd => switch (this) {
    MarketCapCategory.nano => 50_000_000,
    MarketCapCategory.micro => 300_000_000,
    MarketCapCategory.small => 2_000_000_000,
    MarketCapCategory.mid => 10_000_000_000,
    MarketCapCategory.large => 200_000_000_000,
    MarketCapCategory.mega => null,
  };

  /// Classify a market cap value into its category.
  static MarketCapCategory classify(double marketCapUsd) {
    if (marketCapUsd >= MarketCapCategory.mega.minUsd) {
      return MarketCapCategory.mega;
    }
    if (marketCapUsd >= MarketCapCategory.large.minUsd) {
      return MarketCapCategory.large;
    }
    if (marketCapUsd >= MarketCapCategory.mid.minUsd) {
      return MarketCapCategory.mid;
    }
    if (marketCapUsd >= MarketCapCategory.small.minUsd) {
      return MarketCapCategory.small;
    }
    if (marketCapUsd >= MarketCapCategory.micro.minUsd) {
      return MarketCapCategory.micro;
    }
    return MarketCapCategory.nano;
  }
}

/// Snapshot of a ticker's market-cap classification.
class MarketCapSnapshot extends Equatable {
  const MarketCapSnapshot({
    required this.symbol,
    required this.marketCapUsd,
    required this.category,
    required this.snapshotDate,
  }) : assert(marketCapUsd >= 0, 'marketCapUsd must be >= 0');

  final String symbol;
  final double marketCapUsd;
  final MarketCapCategory category;
  final DateTime snapshotDate;

  bool get isMegaCap => category == MarketCapCategory.mega;
  bool get isLargeCap => category == MarketCapCategory.large;
  bool get isSmallOrSmaller =>
      category == MarketCapCategory.small ||
      category == MarketCapCategory.micro ||
      category == MarketCapCategory.nano;

  @override
  List<Object?> get props => [symbol, marketCapUsd, category, snapshotDate];
}
