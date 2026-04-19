import 'package:equatable/equatable.dart';

/// Holding dividend record — per-holding dividend event with type classification.
enum DividendRecordType { cash, stock, special, returnOfCapital }

class HoldingDividendRecord extends Equatable {
  const HoldingDividendRecord({
    required this.ticker,
    required this.exDate,
    required this.paymentDate,
    required this.amountPerShare,
    required this.recordType,
  });

  final String ticker;
  final String exDate;
  final String paymentDate;
  final double amountPerShare;
  final DividendRecordType recordType;

  HoldingDividendRecord copyWith({
    String? ticker,
    String? exDate,
    String? paymentDate,
    double? amountPerShare,
    DividendRecordType? recordType,
  }) => HoldingDividendRecord(
    ticker: ticker ?? this.ticker,
    exDate: exDate ?? this.exDate,
    paymentDate: paymentDate ?? this.paymentDate,
    amountPerShare: amountPerShare ?? this.amountPerShare,
    recordType: recordType ?? this.recordType,
  );

  @override
  List<Object?> get props => [
    ticker,
    exDate,
    paymentDate,
    amountPerShare,
    recordType,
  ];
}
