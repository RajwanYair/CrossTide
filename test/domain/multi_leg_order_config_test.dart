import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MultiLegOrderType', () {
    test('has 8 values', () {
      expect(MultiLegOrderType.values.length, 8);
    });
  });

  group('OrderLeg', () {
    test('isCall is true for call option', () {
      final leg = OrderLeg(
        symbol: 'AAPL',
        quantity: 1,
        isBuy: true,
        strikePrice: 180.0,
        expiryDate: DateTime(2025, 1, 17),
        optionType: 'call',
      );
      expect(leg.isCall, isTrue);
      expect(leg.isPut, isFalse);
    });

    test('isPut is true for put option', () {
      final leg = OrderLeg(
        symbol: 'AAPL',
        quantity: 1,
        isBuy: false,
        strikePrice: 175.0,
        expiryDate: DateTime(2025, 1, 17),
        optionType: 'put',
      );
      expect(leg.isPut, isTrue);
    });
  });

  group('MultiLegOrderConfig', () {
    MultiLegOrderConfig buildConfig({
      double maxLoss = 500.0,
      double maxProfit = 1000.0,
    }) {
      return MultiLegOrderConfig(
        configId: 'cfg1',
        orderType: MultiLegOrderType.bullCallSpread,
        legs: [
          OrderLeg(
            symbol: 'AAPL',
            quantity: 1,
            isBuy: true,
            strikePrice: 180.0,
            expiryDate: DateTime(2025, 1, 17),
            optionType: 'call',
          ),
          OrderLeg(
            symbol: 'AAPL',
            quantity: 1,
            isBuy: false,
            strikePrice: 190.0,
            expiryDate: DateTime(2025, 1, 17),
            optionType: 'call',
          ),
        ],
        maxLoss: maxLoss,
        maxProfit: maxProfit,
      );
    }

    test('legCount returns 2 for two-leg spread', () {
      expect(buildConfig().legCount, 2);
    });

    test('riskReward is maxProfit / maxLoss', () {
      expect(buildConfig().riskReward, closeTo(2.0, 0.001));
    });

    test('riskReward is null when maxLoss is 0', () {
      expect(buildConfig(maxLoss: 0.0).riskReward, isNull);
    });

    test('equality holds for same props', () {
      expect(buildConfig(), equals(buildConfig()));
    });
  });
}
