import 'package:cross_tide/src/domain/signal_aging_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SignalAgingModel', () {
    test('equality', () {
      const a = SignalAgingModel(
        method: 'Micho',
        halfLifeHours: 24.0,
        decayFunction: SignalDecayFunction.exponential,
        minimumConfidence: 0.3,
        isActive: true,
      );
      const b = SignalAgingModel(
        method: 'Micho',
        halfLifeHours: 24.0,
        decayFunction: SignalDecayFunction.exponential,
        minimumConfidence: 0.3,
        isActive: true,
      );
      expect(a, b);
    });

    test('copyWith changes halfLifeHours', () {
      const base = SignalAgingModel(
        method: 'Micho',
        halfLifeHours: 24.0,
        decayFunction: SignalDecayFunction.exponential,
        minimumConfidence: 0.3,
        isActive: true,
      );
      final updated = base.copyWith(halfLifeHours: 48.0);
      expect(updated.halfLifeHours, 48.0);
    });

    test('props length is 5', () {
      const obj = SignalAgingModel(
        method: 'Micho',
        halfLifeHours: 24.0,
        decayFunction: SignalDecayFunction.exponential,
        minimumConfidence: 0.3,
        isActive: true,
      );
      expect(obj.props.length, 5);
    });
  });
}
