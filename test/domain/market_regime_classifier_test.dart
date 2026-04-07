import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const classifier = MarketRegimeClassifier();

  group('MarketRegimeClassifier', () {
    test('classifies bull regime', () {
      final result = classifier.classify(
        const RegimeInput(
          priceAboveSma200: true,
          sma50AboveSma200: true,
          rsi: 65,
          adx: 30,
          breadthThrust: 0.7,
        ),
      );

      expect(result.regime, MarketRegime.bull);
      expect(result.bullScore, greaterThan(result.bearScore));
      expect(result.confidence, greaterThan(50));
    });

    test('classifies bear regime', () {
      final result = classifier.classify(
        const RegimeInput(
          priceAboveSma200: false,
          sma50AboveSma200: false,
          rsi: 35,
          adx: 30,
          breadthThrust: 0.3,
        ),
      );

      expect(result.regime, MarketRegime.bear);
      expect(result.bearScore, greaterThan(result.bullScore));
    });

    test('classifies sideways when low ADX and mixed signals', () {
      final result = classifier.classify(
        const RegimeInput(
          priceAboveSma200: true,
          sma50AboveSma200: false,
          rsi: 48,
          adx: 15,
          breadthThrust: 0.5,
        ),
      );

      expect(result.regime, MarketRegime.sideways);
    });

    test('RegimeInput equality', () {
      const a = RegimeInput(
        priceAboveSma200: true,
        sma50AboveSma200: true,
        rsi: 60,
        adx: 30,
        breadthThrust: 0.7,
      );
      const b = RegimeInput(
        priceAboveSma200: true,
        sma50AboveSma200: true,
        rsi: 60,
        adx: 30,
        breadthThrust: 0.7,
      );
      expect(a, equals(b));
    });
  });
}
