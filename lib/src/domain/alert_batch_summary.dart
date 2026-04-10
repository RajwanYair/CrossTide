import 'package:equatable/equatable.dart';

/// A single entry of an aggregated alert batch.
class AlertBatchEntry extends Equatable {
  const AlertBatchEntry({
    required this.symbol,
    required this.alertType,
    required this.count,
    required this.firstFiredAt,
    required this.lastFiredAt,
  }) : assert(count > 0, 'count must be > 0');

  final String symbol;
  final String alertType;
  final int count;
  final DateTime firstFiredAt;
  final DateTime lastFiredAt;

  Duration get span => lastFiredAt.difference(firstFiredAt);

  @override
  List<Object?> get props => [
    symbol,
    alertType,
    count,
    firstFiredAt,
    lastFiredAt,
  ];
}

/// Aggregated summary report for a batch of alerts.
class AlertBatchSummary extends Equatable {
  const AlertBatchSummary({
    required this.batchId,
    required this.entries,
    required this.generatedAt,
    required this.periodStart,
    required this.periodEnd,
  });

  final String batchId;
  final List<AlertBatchEntry> entries;
  final DateTime generatedAt;
  final DateTime periodStart;
  final DateTime periodEnd;

  int get totalAlerts =>
      entries.fold(0, (final int s, final AlertBatchEntry e) => s + e.count);

  int get uniqueSymbols =>
      entries.map((final AlertBatchEntry e) => e.symbol).toSet().length;

  int get uniqueAlertTypes =>
      entries.map((final AlertBatchEntry e) => e.alertType).toSet().length;

  bool get isEmpty => entries.isEmpty;

  Duration get reportingPeriod => periodEnd.difference(periodStart);

  /// Top N entries by alert count.
  List<AlertBatchEntry> top(int n) {
    final List<AlertBatchEntry> sorted = [...entries]
      ..sort(
        (final AlertBatchEntry a, final AlertBatchEntry b) =>
            b.count.compareTo(a.count),
      );
    return sorted.take(n).toList();
  }

  @override
  List<Object?> get props => [
    batchId,
    entries,
    generatedAt,
    periodStart,
    periodEnd,
  ];
}
