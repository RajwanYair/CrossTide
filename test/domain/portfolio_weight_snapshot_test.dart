import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final capturedAt = DateTime(2026, 4, 10);

  group('PortfolioWeightEntry', () {
    test('isDominant is true when weight >= 10', () {
      const entry = PortfolioWeightEntry(
        ticker: 'AAPL',
        weightPct: 15.0,
        marketValue: 15000,
      );
      expect(entry.isDominant, isTrue);
    });

    test('isDominant is false when weight < 10', () {
      const entry = PortfolioWeightEntry(
        ticker: 'MSFT',
        weightPct: 5.0,
        marketValue: 5000,
      );
      expect(entry.isDominant, isFalse);
    });
  });

  group('PortfolioWeightSnapshot', () {
    final snap = PortfolioWeightSnapshot(
      snapshotId: 'snap-1',
      capturedAt: capturedAt,
      entries: const [
        PortfolioWeightEntry(
          ticker: 'AAPL',
          weightPct: 40.0,
          marketValue: 40000,
        ),
        PortfolioWeightEntry(
          ticker: 'MSFT',
          weightPct: 35.0,
          marketValue: 35000,
        ),
        PortfolioWeightEntry(ticker: 'GOOG', weightPct: 5.0, marketValue: 5000),
      ],
      totalValue: 80000,
    );

    test('dominantTickers includes tickers with weight >= 10', () {
      expect(snap.dominantTickers, containsAll(['AAPL', 'MSFT']));
      expect(snap.dominantTickers, isNot(contains('GOOG')));
    });

    test('topHolding returns highest weight entry', () {
      expect(snap.topHolding?.ticker, equals('AAPL'));
    });

    test('isEmpty is false when entries present', () {
      expect(snap.isEmpty, isFalse);
    });

    test('isEmpty is true for empty snapshot', () {
      final empty = PortfolioWeightSnapshot(
        snapshotId: 'empty',
        capturedAt: capturedAt,
        entries: const [],
        totalValue: 0,
      );
      expect(empty.isEmpty, isTrue);
      expect(empty.topHolding, isNull);
    });

    test('equality holds for same props', () {
      final a = PortfolioWeightSnapshot(
        snapshotId: 'x',
        capturedAt: capturedAt,
        entries: const [],
        totalValue: 0,
      );
      final b = PortfolioWeightSnapshot(
        snapshotId: 'x',
        capturedAt: capturedAt,
        entries: const [],
        totalValue: 0,
      );
      expect(a, equals(b));
    });
  });
}
