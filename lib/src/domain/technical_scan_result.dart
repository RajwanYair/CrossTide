import 'package:equatable/equatable.dart';

/// A matched condition within a technical scan result.
class ScanConditionMatch extends Equatable {
  const ScanConditionMatch({
    required this.conditionName,
    required this.actualValue,
    required this.thresholdValue,
    required this.isSatisfied,
  });

  final String conditionName;
  final double actualValue;
  final double thresholdValue;
  final bool isSatisfied;

  @override
  List<Object?> get props => [
    conditionName,
    actualValue,
    thresholdValue,
    isSatisfied,
  ];
}

/// Result of a technical screener scan for a single ticker.
class TechnicalScanResult extends Equatable {
  const TechnicalScanResult({
    required this.symbol,
    required this.scanName,
    required this.matchedConditions,
    required this.totalConditions,
    required this.scannedAt,
    this.closingPrice,
  }) : assert(totalConditions > 0, 'totalConditions must be > 0'),
       assert(
         matchedConditions.length <= totalConditions,
         'matchedConditions cannot exceed totalConditions',
       );

  final String symbol;
  final String scanName;
  final List<ScanConditionMatch> matchedConditions;
  final int totalConditions;
  final DateTime scannedAt;
  final double? closingPrice;

  int get matchCount => matchedConditions
      .where((final ScanConditionMatch c) => c.isSatisfied)
      .length;

  /// Fraction of conditions satisfied (0.0–1.0).
  double get matchScore => matchCount / totalConditions;

  bool get isFullMatch => matchCount == totalConditions;
  bool get hasPartialMatch => matchCount > 0 && matchCount < totalConditions;

  List<ScanConditionMatch> get failedConditions => matchedConditions
      .where((final ScanConditionMatch c) => !c.isSatisfied)
      .toList();

  @override
  List<Object?> get props => [
    symbol,
    scanName,
    matchedConditions,
    totalConditions,
    scannedAt,
    closingPrice,
  ];
}
