import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SignalFilterRule', () {
    const SignalFilterRule rule = SignalFilterRule(
      methodName: 'rsi',
      direction: SignalFilterDirection.buyOnly,
      minConfidence: 0.7,
    );

    test('appliesToBuy true for buyOnly', () {
      expect(rule.appliesToBuy, isTrue);
    });

    test('appliesToSell false for buyOnly', () {
      expect(rule.appliesToSell, isFalse);
    });

    test('both direction applies to buy and sell', () {
      const SignalFilterRule both = SignalFilterRule(
        methodName: 'macd',
        direction: SignalFilterDirection.both,
      );
      expect(both.appliesToBuy, isTrue);
      expect(both.appliesToSell, isTrue);
    });
  });

  group('TradingSignalFilter', () {
    const SignalFilterRule buyRule = SignalFilterRule(
      methodName: 'rsi',
      direction: SignalFilterDirection.buyOnly,
    );
    const SignalFilterRule sellRule = SignalFilterRule(
      methodName: 'macd',
      direction: SignalFilterDirection.sellOnly,
    );
    const TradingSignalFilter filter = TradingSignalFilter(
      name: 'testFilter',
      rules: [buyRule, sellRule],
    );

    test('ruleCount matches', () {
      expect(filter.ruleCount, 2);
    });

    test('buyRules returns only buy rules', () {
      expect(filter.buyRules, [buyRule]);
    });

    test('sellRules returns only sell rules', () {
      expect(filter.sellRules, [sellRule]);
    });

    test('isEmpty false when has rules', () {
      expect(filter.isEmpty, isFalse);
    });

    test('withRule appends new rule', () {
      const SignalFilterRule extra = SignalFilterRule(
        methodName: 'bollinger',
        direction: SignalFilterDirection.both,
        requireConsensus: true,
      );
      final TradingSignalFilter extended = filter.withRule(extra);
      expect(extended.ruleCount, 3);
      expect(extended.hasConsensusRequirement, isTrue);
    });

    test('hasConsensusRequirement false when no consensus rules', () {
      expect(filter.hasConsensusRequirement, isFalse);
    });

    test('equality', () {
      const TradingSignalFilter same = TradingSignalFilter(
        name: 'testFilter',
        rules: [buyRule, sellRule],
      );
      expect(filter, same);
    });
  });
}
