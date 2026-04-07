import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calculator = RiskRewardCalculator();

  group('RiskRewardCalculator — long', () {
    test('const constructor', () {
      const RiskRewardCalculator Function() create = RiskRewardCalculator.new;
      expect(create(), isNotNull);
    });

    test('computes correct long risk/reward', () {
      final result = calculator.computeLong(
        entryPrice: 100,
        stopLoss: 90,
        targetPrice: 130,
      );
      expect(result, isNotNull);
      expect(result!.riskPercent, closeTo(10.0, 0.01));
      expect(result.rewardPercent, closeTo(30.0, 0.01));
      expect(result.ratio, closeTo(3.0, 0.01));
    });

    test('null when stopLoss >= entry', () {
      expect(
        calculator.computeLong(
          entryPrice: 100,
          stopLoss: 100,
          targetPrice: 120,
        ),
        isNull,
      );
    });

    test('null when target <= entry', () {
      expect(
        calculator.computeLong(entryPrice: 100, stopLoss: 90, targetPrice: 100),
        isNull,
      );
    });

    test('null when entry <= 0', () {
      expect(
        calculator.computeLong(entryPrice: 0, stopLoss: -10, targetPrice: 10),
        isNull,
      );
    });

    test('equatable', () {
      final r1 = calculator.computeLong(
        entryPrice: 100,
        stopLoss: 90,
        targetPrice: 130,
      );
      final r2 = calculator.computeLong(
        entryPrice: 100,
        stopLoss: 90,
        targetPrice: 130,
      );
      expect(r1, equals(r2));
    });
  });

  group('RiskRewardCalculator — short', () {
    test('computes correct short risk/reward', () {
      final result = calculator.computeShort(
        entryPrice: 100,
        stopLoss: 110,
        targetPrice: 70,
      );
      expect(result, isNotNull);
      expect(result!.riskPercent, closeTo(10.0, 0.01));
      expect(result.rewardPercent, closeTo(30.0, 0.01));
      expect(result.ratio, closeTo(3.0, 0.01));
    });

    test('null when stopLoss <= entry', () {
      expect(
        calculator.computeShort(
          entryPrice: 100,
          stopLoss: 100,
          targetPrice: 80,
        ),
        isNull,
      );
    });

    test('null when target >= entry', () {
      expect(
        calculator.computeShort(
          entryPrice: 100,
          stopLoss: 110,
          targetPrice: 100,
        ),
        isNull,
      );
    });
  });
}
