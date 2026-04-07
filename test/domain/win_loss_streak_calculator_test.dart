import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calculator = WinLossStreakCalculator();

  group('WinLossStreakCalculator', () {
    test('const constructor', () {
      const WinLossStreakCalculator Function() create =
          WinLossStreakCalculator.new;
      expect(create(), isNotNull);
    });

    test('returns null for empty list', () {
      expect(calculator.compute([]), isNull);
    });

    test('all wins', () {
      final result = calculator.compute([10, 20, 5, 15, 30]);
      expect(result, isNotNull);
      expect(result!.maxWinStreak, 5);
      expect(result.maxLossStreak, 0);
      expect(result.currentStreakIsWin, isTrue);
    });

    test('all losses', () {
      final result = calculator.compute([-10, -20, -5]);
      expect(result!.maxLossStreak, 3);
      expect(result.maxWinStreak, 0);
      expect(result.currentStreakIsWin, isFalse);
    });

    test('mixed streak detection', () {
      // W W W L L W W W W L
      final result = calculator.compute([5, 3, 1, -2, -4, 6, 2, 8, 1, -3]);
      expect(result!.maxWinStreak, 4);
      expect(result.maxLossStreak, 2);
      expect(result.currentStreak, 1);
      expect(result.currentStreakIsWin, isFalse);
    });

    test('zero counts as win', () {
      final result = calculator.compute([0, 0, -1]);
      expect(result!.maxWinStreak, 2);
      expect(result.currentStreakIsWin, isFalse);
    });

    test('equatable', () {
      final r1 = calculator.compute([10, -5, 20]);
      final r2 = calculator.compute([10, -5, 20]);
      expect(r1, equals(r2));
    });
  });
}
