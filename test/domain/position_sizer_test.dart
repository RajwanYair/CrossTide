import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const sizer = PositionSizer();

  group('PositionSizer', () {
    test('fixedRisk computes shares correctly', () {
      final result = sizer.fixedRisk(
        accountSize: 100000,
        riskPercent: 1.0,
        entryPrice: 50,
        stopLoss: 48,
      );

      // Risk = $1000, risk/share = $2, shares = 500
      expect(result.shares, 500);
      expect(result.dollarRisk, closeTo(1000, 0.01));
      expect(result.positionValue, closeTo(25000, 0.01));
      expect(result.riskPercentOfAccount, closeTo(1.0, 0.01));
    });

    test('fixedRisk returns zero when stop loss above entry', () {
      final result = sizer.fixedRisk(
        accountSize: 100000,
        riskPercent: 1.0,
        entryPrice: 50,
        stopLoss: 50,
      );
      expect(result.shares, 0);
    });

    test('kelly computes optimal fraction', () {
      final result = sizer.kelly(winRate: 0.6, avgWin: 300, avgLoss: 200);

      // Kelly = 0.6 - (0.4 / 1.5) = 0.6 - 0.267 = 0.333
      expect(result.fullKelly, closeTo(0.333, 0.01));
      expect(result.halfKelly, closeTo(0.167, 0.01));
      expect(result.quarterKelly, closeTo(0.083, 0.01));
    });

    test('kelly returns zero for invalid params', () {
      final result = sizer.kelly(winRate: 0, avgWin: 300, avgLoss: 200);
      expect(result.fullKelly, 0);
    });

    test('kelly clamps to 0–1', () {
      final result = sizer.kelly(winRate: 0.3, avgWin: 100, avgLoss: 200);
      expect(result.fullKelly, greaterThanOrEqualTo(0));
      expect(result.fullKelly, lessThanOrEqualTo(1));
    });
  });
}
