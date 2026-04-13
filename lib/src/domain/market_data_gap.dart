import 'package:equatable/equatable.dart';

/// Market data gap — missing candle window with severity classification.
enum GapSeverity { minor, moderate, severe, critical }

class MarketDataGap extends Equatable {
  const MarketDataGap({
    required this.ticker,
    required this.fromDate,
    required this.toDate,
    required this.missingCandles,
    required this.severity,
  });

  final String ticker;
  final String fromDate;
  final String toDate;
  final int missingCandles;
  final GapSeverity severity;

  MarketDataGap copyWith({
    String? ticker,
    String? fromDate,
    String? toDate,
    int? missingCandles,
    GapSeverity? severity,
  }) => MarketDataGap(
    ticker: ticker ?? this.ticker,
    fromDate: fromDate ?? this.fromDate,
    toDate: toDate ?? this.toDate,
    missingCandles: missingCandles ?? this.missingCandles,
    severity: severity ?? this.severity,
  );

  @override
  List<Object?> get props => [
    ticker,
    fromDate,
    toDate,
    missingCandles,
    severity,
  ];
}
