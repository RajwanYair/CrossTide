import 'package:equatable/equatable.dart';

/// Market capitalisation size tier classification.
enum CapSizeTier {
  /// < USD 300 million
  nanoCapital,

  /// USD 300 million – USD 2 billion
  smallCapital,

  /// USD 2 billion – USD 10 billion
  midCapital,

  /// USD 10 billion – USD 200 billion
  largeCapital,

  /// > USD 200 billion
  megaCapital,
}

/// Classifies a ticker's market capitalisation size tier.
class MarketCapTierClassifier extends Equatable {
  const MarketCapTierClassifier({
    required this.ticker,
    required this.tier,
    required this.marketCapUsd,
    required this.classifiedAt,
  });

  final String ticker;
  final CapSizeTier tier;

  /// Market capitalisation in USD.
  final double marketCapUsd;

  final DateTime classifiedAt;

  MarketCapTierClassifier copyWith({
    String? ticker,
    CapSizeTier? tier,
    double? marketCapUsd,
    DateTime? classifiedAt,
  }) => MarketCapTierClassifier(
    ticker: ticker ?? this.ticker,
    tier: tier ?? this.tier,
    marketCapUsd: marketCapUsd ?? this.marketCapUsd,
    classifiedAt: classifiedAt ?? this.classifiedAt,
  );

  @override
  List<Object?> get props => [ticker, tier, marketCapUsd, classifiedAt];
}
