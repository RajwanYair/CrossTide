import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final observedAt = DateTime(2026, 4, 10);

  group('CurrencyRateEntry', () {
    final rate = CurrencyRateEntry(
      baseCurrency: 'USD',
      quoteCurrency: 'EUR',
      midRate: 0.92,
      observedAt: observedAt,
      bidRate: 0.915,
      askRate: 0.925,
    );

    test('pairLabel returns correct format', () {
      expect(rate.pairLabel, equals('USD/EUR'));
    });

    test('convert applies midRate correctly', () {
      expect(rate.convert(100.0), closeTo(92.0, 0.001));
    });

    test('spread computes bid-ask spread', () {
      expect(rate.spread, closeTo(0.01, 0.0001));
    });

    test('spread is null when bid or ask is null', () {
      final noSpread = CurrencyRateEntry(
        baseCurrency: 'USD',
        quoteCurrency: 'GBP',
        midRate: 0.79,
        observedAt: observedAt,
      );
      expect(noSpread.spread, isNull);
    });

    test('equality holds for same props', () {
      final a = CurrencyRateEntry(
        baseCurrency: 'USD',
        quoteCurrency: 'JPY',
        midRate: 150.0,
        observedAt: observedAt,
      );
      final b = CurrencyRateEntry(
        baseCurrency: 'USD',
        quoteCurrency: 'JPY',
        midRate: 150.0,
        observedAt: observedAt,
      );
      expect(a, equals(b));
    });
  });
}
