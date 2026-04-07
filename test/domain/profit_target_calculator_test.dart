import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = ProfitTargetCalculator();

  group('ProfitTargetCalculator', () {
    test('fixedPercentage returns correct targets', () {
      final result = calc.fixedPercentage(
        entryPrice: 100,
        targetPcts: [5, 10, 15],
      );

      expect(result.entryPrice, 100);
      expect(result.targets, hasLength(3));
      expect(result.targets[0].price, closeTo(105, 0.01));
      expect(result.targets[1].price, closeTo(110, 0.01));
      expect(result.targets[2].price, closeTo(115, 0.01));
      expect(result.targets[0].returnPct, closeTo(5, 0.01));
    });

    test('riskReward returns correct R:R targets', () {
      final result = calc.riskReward(
        entryPrice: 100,
        stopLoss: 95,
        ratios: [1.0, 2.0, 3.0],
      );

      expect(result.targets, hasLength(3));
      expect(result.targets[0].price, closeTo(105, 0.01));
      expect(result.targets[1].price, closeTo(110, 0.01));
      expect(result.targets[2].price, closeTo(115, 0.01));
    });

    test('riskReward returns empty on invalid stop loss', () {
      final result = calc.riskReward(
        entryPrice: 100,
        stopLoss: 105,
        ratios: [1.0],
      );
      expect(result.targets, isEmpty);
    });

    test('fibonacciExtension returns Fibonacci levels', () {
      final result = calc.fibonacciExtension(swingLow: 80, swingHigh: 100);

      expect(result.targets, hasLength(5));
      expect(result.targets[0].label, contains('1.000'));
      expect(result.targets[0].price, closeTo(100, 0.01));
    });

    test('fibonacciExtension handles zero range', () {
      final result = calc.fibonacciExtension(swingLow: 100, swingHigh: 100);
      expect(result.targets, isEmpty);
    });
  });
}
