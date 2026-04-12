import 'package:equatable/equatable.dart';

/// Source type for alternative data signals.
enum AltDataSource {
  /// Web-search trend interest.
  searchTrend,

  /// Social media sentiment aggregation.
  socialSentiment,

  /// Satellite or geospatial intelligence.
  satelliteData,

  /// Credit/debit card transaction flow.
  transactionData,

  /// Web-traffic or app-usage data.
  webTraffic,
}

/// A trading signal derived from an alternative (non-price) data source.
class AltDataSignal extends Equatable {
  /// Creates an [AltDataSignal].
  const AltDataSignal({
    required this.signalId,
    required this.ticker,
    required this.source,
    required this.signalScore,
    required this.generatedAt,
    required this.periodDays,
  });

  /// Unique identifier for this signal.
  final String signalId;

  /// Ticker the signal is associated with.
  final String ticker;

  /// The alternative data source that generated this signal.
  final AltDataSource source;

  /// Normalised signal score [-1.0, 1.0]; positive = bullish.
  final double signalScore;

  /// Timestamp when the signal was generated.
  final DateTime generatedAt;

  /// Lookback period used to produce the signal (in days).
  final int periodDays;

  /// Returns `true` when the signal is bullish (score > 0.2).
  bool get isBullish => signalScore > 0.20;

  /// Returns `true` when the signal is bearish (score < -0.2).
  bool get isBearish => signalScore < -0.20;

  /// Returns `true` when the signal strength is strong (abs > 0.6).
  bool get isStrong => signalScore.abs() > 0.60;

  @override
  List<Object?> get props => [
    signalId,
    ticker,
    source,
    signalScore,
    generatedAt,
    periodDays,
  ];
}
