import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('OptionGreeksSnapshot', () {
    OptionGreeksSnapshot buildSnapshot({
      String optionType = 'call',
      double delta = 0.5,
    }) {
      return OptionGreeksSnapshot(
        underlyingSymbol: 'AAPL',
        strikePrice: 180.0,
        expiryDate: DateTime(2025, 1, 17),
        optionType: optionType,
        delta: delta,
        gamma: 0.05,
        theta: -0.02,
        vega: 0.15,
        rho: 0.01,
        impliedVolatility: 25.0,
        snapshotAt: DateTime(2024, 6, 1),
      );
    }

    test('isCall is true for call option', () {
      expect(buildSnapshot(optionType: 'call').isCall, isTrue);
      expect(buildSnapshot(optionType: 'call').isPut, isFalse);
    });

    test('isPut is true for put option', () {
      expect(buildSnapshot(optionType: 'put').isPut, isTrue);
      expect(buildSnapshot(optionType: 'put').isCall, isFalse);
    });

    test('isDeepInTheMoney is true when |delta| >= 0.8', () {
      expect(buildSnapshot(delta: 0.8).isDeepInTheMoney, isTrue);
      expect(buildSnapshot(delta: -0.9).isDeepInTheMoney, isTrue);
    });

    test('isDeepInTheMoney is false when |delta| < 0.8', () {
      expect(buildSnapshot(delta: 0.5).isDeepInTheMoney, isFalse);
    });

    test('equality holds for same props', () {
      expect(buildSnapshot(), equals(buildSnapshot()));
    });
  });
}
