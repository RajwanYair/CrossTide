import 'package:cross_tide/src/domain/adaptive_stop_loss.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AdaptiveStopLoss', () {
    test('equality', () {
      const a = AdaptiveStopLoss(
        ticker: 'AAPL',
        entryPrice: 190.0,
        stopPrice: 183.0,
        adaptationRule: StopLossAdaptationRule.trailingAtr,
        isTriggered: false,
      );
      const b = AdaptiveStopLoss(
        ticker: 'AAPL',
        entryPrice: 190.0,
        stopPrice: 183.0,
        adaptationRule: StopLossAdaptationRule.trailingAtr,
        isTriggered: false,
      );
      expect(a, b);
    });

    test('copyWith changes stopPrice', () {
      const base = AdaptiveStopLoss(
        ticker: 'AAPL',
        entryPrice: 190.0,
        stopPrice: 183.0,
        adaptationRule: StopLossAdaptationRule.trailingAtr,
        isTriggered: false,
      );
      final updated = base.copyWith(stopPrice: 184.0);
      expect(updated.stopPrice, 184.0);
    });

    test('props length is 5', () {
      const obj = AdaptiveStopLoss(
        ticker: 'AAPL',
        entryPrice: 190.0,
        stopPrice: 183.0,
        adaptationRule: StopLossAdaptationRule.trailingAtr,
        isTriggered: false,
      );
      expect(obj.props.length, 5);
    });
  });
}
