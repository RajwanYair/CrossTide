import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BacktestComparisonEntry', () {
    test('equality holds for same props', () {
      const a = BacktestComparisonEntry(
        strategyId: 's1',
        totalReturnPct: 12.0,
        maxDrawdownPct: 5.0,
        sharpeRatio: 1.5,
        winRatePct: 60.0,
      );
      const b = BacktestComparisonEntry(
        strategyId: 's1',
        totalReturnPct: 12.0,
        maxDrawdownPct: 5.0,
        sharpeRatio: 1.5,
        winRatePct: 60.0,
      );
      expect(a, equals(b));
    });
  });

  group('BacktestComparisonSet', () {
    BacktestComparisonSet buildSet() {
      return BacktestComparisonSet(
        setId: 'cmp1',
        entries: const [
          BacktestComparisonEntry(
            strategyId: 'trend',
            totalReturnPct: 20.0,
            maxDrawdownPct: 8.0,
            sharpeRatio: 1.8,
            winRatePct: 58.0,
          ),
          BacktestComparisonEntry(
            strategyId: 'mean_rev',
            totalReturnPct: 15.0,
            maxDrawdownPct: 5.0,
            sharpeRatio: 2.1,
            winRatePct: 62.0,
          ),
          BacktestComparisonEntry(
            strategyId: 'breakout',
            totalReturnPct: 10.0,
            maxDrawdownPct: 12.0,
            sharpeRatio: 0.9,
            winRatePct: 48.0,
          ),
        ],
        comparedAt: DateTime(2024, 6, 1),
      );
    }

    test('bestReturn returns entry with highest totalReturnPct', () {
      expect(buildSet().bestReturn?.strategyId, 'trend');
    });

    test('bestSharpe returns entry with highest sharpeRatio', () {
      expect(buildSet().bestSharpe?.strategyId, 'mean_rev');
    });

    test('bestReturn is null for empty set', () {
      final empty = BacktestComparisonSet(
        setId: 'empty',
        entries: const [],
        comparedAt: DateTime(2024, 1, 1),
      );
      expect(empty.bestReturn, isNull);
      expect(empty.bestSharpe, isNull);
    });

    test('equality holds for same props', () {
      expect(buildSet(), equals(buildSet()));
    });
  });
}
