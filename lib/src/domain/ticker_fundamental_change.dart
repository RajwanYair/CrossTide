import 'package:equatable/equatable.dart';

/// Ticker fundamental change — discrete change event for a fundamental metric.
enum FundamentalChangeType {
  earningsRevision,
  guidanceUpdate,
  analystCoverage,
  ratingChange,
  dividendChange,
}

class TickerFundamentalChange extends Equatable {
  const TickerFundamentalChange({
    required this.ticker,
    required this.changeType,
    required this.previousValue,
    required this.newValue,
    required this.source,
  });

  final String ticker;
  final FundamentalChangeType changeType;
  final String previousValue;
  final String newValue;
  final String source;

  TickerFundamentalChange copyWith({
    String? ticker,
    FundamentalChangeType? changeType,
    String? previousValue,
    String? newValue,
    String? source,
  }) => TickerFundamentalChange(
    ticker: ticker ?? this.ticker,
    changeType: changeType ?? this.changeType,
    previousValue: previousValue ?? this.previousValue,
    newValue: newValue ?? this.newValue,
    source: source ?? this.source,
  );

  @override
  List<Object?> get props => [
    ticker,
    changeType,
    previousValue,
    newValue,
    source,
  ];
}
