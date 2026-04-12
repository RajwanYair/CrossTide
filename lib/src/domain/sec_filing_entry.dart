import 'package:equatable/equatable.dart';

/// SEC filing type classification.
enum SecFilingType {
  form8K,
  form10K,
  form10Q,
  form4,
  formS1,
  formDef14A,
  formSC13G,
  formSC13D,
  other,
}

/// Metadata for a single SEC EDGAR filing.
class SecFilingEntry extends Equatable {
  const SecFilingEntry({
    required this.ticker,
    required this.filingType,
    required this.filingDate,
    required this.accessionNumber,
    required this.description,
    this.edgarUrl,
    this.periodOfReport,
  });

  final String ticker;
  final SecFilingType filingType;
  final DateTime filingDate;

  /// EDGAR accession number in "XXXXXXXXXX-YY-ZZZZZZ" format.
  final String accessionNumber;

  final String description;

  /// Direct EDGAR URL to the filing index page.
  final String? edgarUrl;

  final DateTime? periodOfReport;

  SecFilingEntry copyWith({
    String? ticker,
    SecFilingType? filingType,
    DateTime? filingDate,
    String? accessionNumber,
    String? description,
    String? edgarUrl,
    DateTime? periodOfReport,
  }) => SecFilingEntry(
    ticker: ticker ?? this.ticker,
    filingType: filingType ?? this.filingType,
    filingDate: filingDate ?? this.filingDate,
    accessionNumber: accessionNumber ?? this.accessionNumber,
    description: description ?? this.description,
    edgarUrl: edgarUrl ?? this.edgarUrl,
    periodOfReport: periodOfReport ?? this.periodOfReport,
  );

  @override
  List<Object?> get props => [
    ticker,
    filingType,
    filingDate,
    accessionNumber,
    description,
    edgarUrl,
    periodOfReport,
  ];
}
