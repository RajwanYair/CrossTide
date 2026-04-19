import 'package:cross_tide/src/domain/regime_aware_signal.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RegimeAwareSignal', () {
    test('equality', () {
      const a = RegimeAwareSignal(
        ticker: 'AAPL',
        baseSignal: 'BUY',
        regime: 'bullish',
        adjustment: RegimeSignalAdjustment.boosted,
        adjustedConfidence: 0.88,
      );
      const b = RegimeAwareSignal(
        ticker: 'AAPL',
        baseSignal: 'BUY',
        regime: 'bullish',
        adjustment: RegimeSignalAdjustment.boosted,
        adjustedConfidence: 0.88,
      );
      expect(a, b);
    });

    test('copyWith changes adjustedConfidence', () {
      const base = RegimeAwareSignal(
        ticker: 'AAPL',
        baseSignal: 'BUY',
        regime: 'bullish',
        adjustment: RegimeSignalAdjustment.boosted,
        adjustedConfidence: 0.88,
      );
      final updated = base.copyWith(adjustedConfidence: 0.92);
      expect(updated.adjustedConfidence, 0.92);
    });

    test('props length is 5', () {
      const obj = RegimeAwareSignal(
        ticker: 'AAPL',
        baseSignal: 'BUY',
        regime: 'bullish',
        adjustment: RegimeSignalAdjustment.boosted,
        adjustedConfidence: 0.88,
      );
      expect(obj.props.length, 5);
    });
  });
}
