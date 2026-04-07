import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calculator = PositionSizeCalculator();

  group('PositionSizeCalculator — fixedFractional', () {
    test('const constructor', () {
      const PositionSizeCalculator Function() create =
          PositionSizeCalculator.new;
      expect(create(), isNotNull);
    });

    test('computes correct shares', () {
      // Account $10,000, risk 2%, entry $100, stop $95 → risk $5/share
      // $200 at risk ÷ $5 = 40 shares
      final result = calculator.computeFixedFractional(
        accountSize: 10000,
        entryPrice: 100,
        stopLoss: 95,
        riskPercent: 2,
      );
      expect(result, isNotNull);
      expect(result!.shares, 40);
      expect(result.totalCost, 4000);
      expect(result.riskAmount, 200);
      expect(result.riskPercent, closeTo(2.0, 0.01));
    });

    test('null when stopLoss >= entry', () {
      expect(
        calculator.computeFixedFractional(
          accountSize: 10000,
          entryPrice: 100,
          stopLoss: 100,
          riskPercent: 2,
        ),
        isNull,
      );
    });

    test('null when account <= 0', () {
      expect(
        calculator.computeFixedFractional(
          accountSize: 0,
          entryPrice: 100,
          stopLoss: 95,
          riskPercent: 2,
        ),
        isNull,
      );
    });

    test('equatable', () {
      final r1 = calculator.computeFixedFractional(
        accountSize: 10000,
        entryPrice: 100,
        stopLoss: 95,
        riskPercent: 2,
      );
      final r2 = calculator.computeFixedFractional(
        accountSize: 10000,
        entryPrice: 100,
        stopLoss: 95,
        riskPercent: 2,
      );
      expect(r1, equals(r2));
    });
  });

  group('PositionSizeCalculator — fixedDollar', () {
    test('computes correct shares', () {
      // Risk $500, entry $100, stop $95 → $5/share → 100 shares
      final result = calculator.computeFixedDollar(
        accountSize: 50000,
        entryPrice: 100,
        stopLoss: 95,
        fixedRiskDollars: 500,
      );
      expect(result, isNotNull);
      expect(result!.shares, 100);
      expect(result.totalCost, 10000);
    });

    test('null when fixedRiskDollars <= 0', () {
      expect(
        calculator.computeFixedDollar(
          accountSize: 50000,
          entryPrice: 100,
          stopLoss: 95,
          fixedRiskDollars: 0,
        ),
        isNull,
      );
    });
  });
}
