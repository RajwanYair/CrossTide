import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertBatchSummary', () {
    final DateTime periodStart = DateTime(2025, 1, 1);
    final DateTime periodEnd = DateTime(2025, 1, 7);
    final DateTime generated = DateTime(2025, 1, 7, 17, 0);

    final AlertBatchEntry entryA = AlertBatchEntry(
      symbol: 'AAPL',
      alertType: 'sma200CrossUp',
      count: 3,
      firstFiredAt: DateTime(2025, 1, 2),
      lastFiredAt: DateTime(2025, 1, 4),
    );

    final AlertBatchEntry entryB = AlertBatchEntry(
      symbol: 'MSFT',
      alertType: 'rsiOversold',
      count: 5,
      firstFiredAt: DateTime(2025, 1, 3),
      lastFiredAt: DateTime(2025, 1, 6),
    );

    final AlertBatchSummary summary = AlertBatchSummary(
      batchId: 'w1',
      entries: [entryA, entryB],
      generatedAt: generated,
      periodStart: periodStart,
      periodEnd: periodEnd,
    );

    test('totalAlerts sums entry counts', () {
      expect(summary.totalAlerts, 8);
    });

    test('uniqueSymbols', () {
      expect(summary.uniqueSymbols, 2);
    });

    test('uniqueAlertTypes', () {
      expect(summary.uniqueAlertTypes, 2);
    });

    test('reportingPeriod is 6 days', () {
      expect(summary.reportingPeriod, const Duration(days: 6));
    });

    test('top(1) returns highest count entry', () {
      expect(summary.top(1).first.symbol, 'MSFT');
    });

    test('top(2) returns both entries', () {
      expect(summary.top(2).length, 2);
    });

    test('isEmpty false when has entries', () {
      expect(summary.isEmpty, isFalse);
    });

    test('entry span duration', () {
      expect(entryA.span, const Duration(days: 2));
    });

    test('equality', () {
      final AlertBatchSummary same = AlertBatchSummary(
        batchId: 'w1',
        entries: [entryA, entryB],
        generatedAt: generated,
        periodStart: periodStart,
        periodEnd: periodEnd,
      );
      expect(summary, same);
    });
  });
}
