import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketRegimeType', () {
    test('has 6 values', () {
      expect(MarketRegimeType.values.length, 6);
    });
  });

  group('MarketRegimeSignal', () {
    MarketRegimeSignal buildSignal({
      MarketRegimeType regime = MarketRegimeType.bullTrend,
      double confidencePct = 80.0,
      MarketRegimeType? previousRegime,
    }) {
      return MarketRegimeSignal(
        instrumentId: 'SPY',
        regime: regime,
        confidencePct: confidencePct,
        detectedAt: DateTime(2024, 6, 1),
        previousRegime: previousRegime,
      );
    }

    test('hasRegimeChanged is true when regime differs from previous', () {
      expect(
        buildSignal(
          regime: MarketRegimeType.bearTrend,
          previousRegime: MarketRegimeType.bullTrend,
        ).hasRegimeChanged,
        isTrue,
      );
    });

    test('hasRegimeChanged is false when no previous regime', () {
      expect(buildSignal().hasRegimeChanged, isFalse);
    });

    test('hasRegimeChanged is false when regime same as previous', () {
      expect(
        buildSignal(
          regime: MarketRegimeType.bullTrend,
          previousRegime: MarketRegimeType.bullTrend,
        ).hasRegimeChanged,
        isFalse,
      );
    });

    test('isHighConfidence is true when confidencePct >= 70', () {
      expect(buildSignal(confidencePct: 70.0).isHighConfidence, isTrue);
    });

    test('isHighConfidence is false when confidencePct < 70', () {
      expect(buildSignal(confidencePct: 69.9).isHighConfidence, isFalse);
    });

    test('isTrending is true for bullTrend', () {
      expect(
        buildSignal(regime: MarketRegimeType.bullTrend).isTrending,
        isTrue,
      );
    });

    test('isTrending is true for bearTrend', () {
      expect(
        buildSignal(regime: MarketRegimeType.bearTrend).isTrending,
        isTrue,
      );
    });

    test('isTrending is false for rangeBound', () {
      expect(
        buildSignal(regime: MarketRegimeType.rangeBound).isTrending,
        isFalse,
      );
    });

    test('equality holds for same props', () {
      expect(buildSignal(), equals(buildSignal()));
    });
  });
}
