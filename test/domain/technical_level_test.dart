import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TechnicalLevel', () {
    test('const constructor and equality', () {
      const l1 = TechnicalLevel(
        ticker: 'AAPL',
        price: 148.50,
        levelType: LevelType.support,
        source: LevelSource.pivotPoint,
        label: 'S1',
      );
      const l2 = TechnicalLevel(
        ticker: 'AAPL',
        price: 148.50,
        levelType: LevelType.support,
        source: LevelSource.pivotPoint,
        label: 'S1',
      );
      expect(l1, equals(l2));
    });

    test('displayLabel uses label when provided', () {
      const level = TechnicalLevel(
        ticker: 'AAPL',
        price: 150,
        levelType: LevelType.resistance,
        source: LevelSource.fibonacci,
        label: '61.8% Fib',
      );
      expect(level.displayLabel, '61.8% Fib');
    });

    test('displayLabel auto-generates when label is null', () {
      const level = TechnicalLevel(
        ticker: 'AAPL',
        price: 148.50,
        levelType: LevelType.support,
        source: LevelSource.pivotPoint,
      );
      expect(level.displayLabel, 'Support @ 148.50');
    });

    test('LevelType labels', () {
      expect(LevelType.support.label, 'Support');
      expect(LevelType.resistance.label, 'Resistance');
    });

    test('LevelSource labels', () {
      expect(LevelSource.pivotPoint.label, 'Pivot Point');
      expect(LevelSource.fibonacci.label, 'Fibonacci');
      expect(LevelSource.bollingerBand.label, 'Bollinger Band');
      expect(LevelSource.donchianChannel.label, 'Donchian Channel');
      expect(LevelSource.keltnerChannel.label, 'Keltner Channel');
      expect(LevelSource.manual.label, 'Manual');
    });

    test('computedAt is optional', () {
      const level = TechnicalLevel(
        ticker: 'AAPL',
        price: 150,
        levelType: LevelType.resistance,
        source: LevelSource.manual,
      );
      expect(level.computedAt, isNull);
    });

    test('computedAt when provided', () {
      final now = DateTime(2024, 6, 15);
      final level = TechnicalLevel(
        ticker: 'AAPL',
        price: 150,
        levelType: LevelType.resistance,
        source: LevelSource.bollingerBand,
        computedAt: now,
      );
      expect(level.computedAt, now);
    });
  });
}
