import 'package:cross_tide/src/domain/market_phase_classifier.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketPhaseClassifier', () {
    test('equality', () {
      const a = MarketPhaseClassifier(
        ticker: 'AAPL',
        phase: MarketPhase.markup,
        confidence: 0.82,
        priceLevel: 195.0,
        volumeSignal: 'above_average',
      );
      const b = MarketPhaseClassifier(
        ticker: 'AAPL',
        phase: MarketPhase.markup,
        confidence: 0.82,
        priceLevel: 195.0,
        volumeSignal: 'above_average',
      );
      expect(a, b);
    });

    test('copyWith changes confidence', () {
      const base = MarketPhaseClassifier(
        ticker: 'AAPL',
        phase: MarketPhase.markup,
        confidence: 0.82,
        priceLevel: 195.0,
        volumeSignal: 'above_average',
      );
      final updated = base.copyWith(confidence: 0.85);
      expect(updated.confidence, 0.85);
    });

    test('props length is 5', () {
      const obj = MarketPhaseClassifier(
        ticker: 'AAPL',
        phase: MarketPhase.markup,
        confidence: 0.82,
        priceLevel: 195.0,
        volumeSignal: 'above_average',
      );
      expect(obj.props.length, 5);
    });
  });
}
