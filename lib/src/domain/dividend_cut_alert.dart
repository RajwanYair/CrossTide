import 'package:equatable/equatable.dart';

/// Nature of a dividend change event.
enum DividendChangeType {
  cut,
  increase,
  initiation,
  suspension,
  resumption,
  special,
}

/// An alert fired when a company announces a dividend change.
class DividendCutAlert extends Equatable {
  const DividendCutAlert({
    required this.ticker,
    required this.changeType,
    required this.newDividendPerShare,
    required this.announcedAt,
    this.previousDividendPerShare,
    this.changePercent,
    this.exDividendDate,
  });

  final String ticker;
  final DividendChangeType changeType;
  final double newDividendPerShare;
  final DateTime announcedAt;

  final double? previousDividendPerShare;

  /// Percentage change vs. prior dividend (negative for cuts).
  final double? changePercent;

  final DateTime? exDividendDate;

  DividendCutAlert copyWith({
    String? ticker,
    DividendChangeType? changeType,
    double? newDividendPerShare,
    DateTime? announcedAt,
    double? previousDividendPerShare,
    double? changePercent,
    DateTime? exDividendDate,
  }) => DividendCutAlert(
    ticker: ticker ?? this.ticker,
    changeType: changeType ?? this.changeType,
    newDividendPerShare: newDividendPerShare ?? this.newDividendPerShare,
    announcedAt: announcedAt ?? this.announcedAt,
    previousDividendPerShare:
        previousDividendPerShare ?? this.previousDividendPerShare,
    changePercent: changePercent ?? this.changePercent,
    exDividendDate: exDividendDate ?? this.exDividendDate,
  );

  @override
  List<Object?> get props => [
    ticker,
    changeType,
    newDividendPerShare,
    announcedAt,
    previousDividendPerShare,
    changePercent,
    exDividendDate,
  ];
}
