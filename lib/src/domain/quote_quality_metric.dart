import 'package:equatable/equatable.dart';

/// Data quality assessment for a real-time or delayed quote.
class QuoteQualityMetric extends Equatable {
  const QuoteQualityMetric({
    required this.ticker,
    required this.providerName,
    required this.isRealTime,
    required this.delaySeconds,
    required this.spreadPercent,
    required this.stalePriceFlag,
    required this.measuredAt,
  });

  final String ticker;
  final String providerName;

  /// `true` when the quote is real-time (L1/L2), `false` for delayed.
  final bool isRealTime;

  /// Quote delay in seconds (0 for real-time).
  final int delaySeconds;

  /// Bid–ask spread as a percentage of mid-price.
  final double spreadPercent;

  /// `true` when the last trade time is older than expected freshness policy.
  final bool stalePriceFlag;

  final DateTime measuredAt;

  QuoteQualityMetric copyWith({
    String? ticker,
    String? providerName,
    bool? isRealTime,
    int? delaySeconds,
    double? spreadPercent,
    bool? stalePriceFlag,
    DateTime? measuredAt,
  }) => QuoteQualityMetric(
    ticker: ticker ?? this.ticker,
    providerName: providerName ?? this.providerName,
    isRealTime: isRealTime ?? this.isRealTime,
    delaySeconds: delaySeconds ?? this.delaySeconds,
    spreadPercent: spreadPercent ?? this.spreadPercent,
    stalePriceFlag: stalePriceFlag ?? this.stalePriceFlag,
    measuredAt: measuredAt ?? this.measuredAt,
  );

  @override
  List<Object?> get props => [
    ticker,
    providerName,
    isRealTime,
    delaySeconds,
    spreadPercent,
    stalePriceFlag,
    measuredAt,
  ];
}
