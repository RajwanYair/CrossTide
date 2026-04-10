import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('IndexConstituentEntry', () {
    test('isDominant true when weight >= 5%', () {
      const heavy = IndexConstituentEntry(
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        weightPct: 7.2,
        sector: 'Technology',
      );
      expect(heavy.isDominant, isTrue);

      const light = IndexConstituentEntry(
        symbol: 'XYZ',
        companyName: 'XYZ Corp.',
        weightPct: 0.5,
        sector: 'Utilities',
      );
      expect(light.isDominant, isFalse);
    });
  });

  group('IndexCompositeSnapshot', () {
    late DateTime ts;

    setUp(() => ts = DateTime(2025, 6, 1));

    test('empty snapshot', () {
      final snap = IndexCompositeSnapshot(
        indexSymbol: 'SPY',
        indexName: 'S&P 500 ETF',
        constituents: const [],
        capturedAt: ts,
      );
      expect(snap.isEmpty, isTrue);
      expect(snap.constituentCount, 0);
      expect(snap.totalWeightPct, 0.0);
    });

    test('totalWeightPct and topN', () {
      final snap = IndexCompositeSnapshot(
        indexSymbol: 'QQQ',
        indexName: 'Nasdaq 100 ETF',
        constituents: const [
          IndexConstituentEntry(
            symbol: 'MSFT',
            companyName: 'Microsoft',
            weightPct: 9.0,
            sector: 'Technology',
          ),
          IndexConstituentEntry(
            symbol: 'AAPL',
            companyName: 'Apple',
            weightPct: 8.5,
            sector: 'Technology',
          ),
          IndexConstituentEntry(
            symbol: 'NVDA',
            companyName: 'Nvidia',
            weightPct: 6.0,
            sector: 'Technology',
          ),
          IndexConstituentEntry(
            symbol: 'TSLA',
            companyName: 'Tesla',
            weightPct: 3.0,
            sector: 'Consumer Discretionary',
          ),
        ],
        capturedAt: ts,
        totalHoldings: 100,
      );
      expect(snap.constituentCount, 4);
      expect(snap.totalWeightPct, closeTo(26.5, 0.001));
      expect(snap.topN(2).first.symbol, 'MSFT');
      expect(snap.topN(2).last.symbol, 'AAPL');
      expect(snap.dominantHoldings.length, 3);
    });

    test('equality holds for identical snapshots', () {
      final a = IndexCompositeSnapshot(
        indexSymbol: 'X',
        indexName: 'X',
        constituents: const [],
        capturedAt: ts,
      );
      final b = IndexCompositeSnapshot(
        indexSymbol: 'X',
        indexName: 'X',
        constituents: const [],
        capturedAt: ts,
      );
      expect(a, equals(b));
    });
  });
}
