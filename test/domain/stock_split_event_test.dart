import 'package:cross_tide/src/domain/stock_split_event.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('StockSplitEvent', () {
    test('equality', () {
      final a = StockSplitEvent(
        ticker: 'NVDA',
        splitType: StockSplitType.forward,
        numerator: 10,
        denominator: 1,
        exDate: DateTime(2025, 6, 10),
        announcedAt: DateTime(2025, 5, 20),
      );
      final b = StockSplitEvent(
        ticker: 'NVDA',
        splitType: StockSplitType.forward,
        numerator: 10,
        denominator: 1,
        exDate: DateTime(2025, 6, 10),
        announcedAt: DateTime(2025, 5, 20),
      );
      expect(a, b);
    });

    test('copyWith changes numerator', () {
      final base = StockSplitEvent(
        ticker: 'NVDA',
        splitType: StockSplitType.forward,
        numerator: 10,
        denominator: 1,
        exDate: DateTime(2025, 6, 10),
        announcedAt: DateTime(2025, 5, 20),
      );
      final updated = base.copyWith(numerator: 4);
      expect(updated.numerator, 4);
    });

    test('props length is 7', () {
      final obj = StockSplitEvent(
        ticker: 'NVDA',
        splitType: StockSplitType.forward,
        numerator: 10,
        denominator: 1,
        exDate: DateTime(2025, 6, 10),
        announcedAt: DateTime(2025, 5, 20),
      );
      expect(obj.props.length, 7);
    });
  });
}
