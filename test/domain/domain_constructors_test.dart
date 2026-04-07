/// Tests that exercise runtime (non-const) construction of domain classes.
///
/// Dart's coverage tool may not instrument `const` constructor calls because
/// they are evaluated at compile-time. These tests use non-const instances
/// to ensure constructor lines are covered.
library;

import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Runtime construction coverage', () {
    test('AlertStateMachine non-const', () {
      // ignore: prefer_const_constructors
      final machine = AlertStateMachine();
      expect(machine, isA<AlertStateMachine>());
    });

    test('BollingerCalculator non-const with defaults', () {
      // ignore: prefer_const_constructors
      final calc = BollingerCalculator();
      expect(calc.period, 20);
      expect(calc.multiplier, 2.0);
    });

    test('CrossUpAnomalyDetector non-const with defaults', () {
      // ignore: prefer_const_constructors
      final det = CrossUpAnomalyDetector();
      expect(det.windowHours, 24);
      expect(det.minOccurrences, 2);
    });

    test('CrossUpDetector non-const with defaults', () {
      // ignore: prefer_const_constructors
      final det = CrossUpDetector();
      expect(det.smaCalculator, isA<SmaCalculator>());
    });

    test('GoldenCrossDetector non-const with defaults', () {
      // ignore: prefer_const_constructors
      final det = GoldenCrossDetector();
      expect(det.smaCalculator, isA<SmaCalculator>());
    });

    test('MacdCalculator non-const with defaults', () {
      // ignore: prefer_const_constructors
      final calc = MacdCalculator();
      expect(calc.fastPeriod, 12);
      expect(calc.slowPeriod, 26);
      expect(calc.signalPeriod, 9);
    });

    test('MichoMethodDetector non-const with defaults', () {
      // ignore: prefer_const_constructors
      final det = MichoMethodDetector();
      expect(det.smaCalculator, isA<SmaCalculator>());
      expect(det.maxAboveRatio, 0.05);
    });

    test('RsiCalculator non-const', () {
      // ignore: prefer_const_constructors
      final calc = RsiCalculator();
      expect(calc, isA<RsiCalculator>());
    });

    test('VolumeCalculator non-const', () {
      // ignore: prefer_const_constructors
      final calc = VolumeCalculator();
      expect(calc, isA<VolumeCalculator>());
    });

    test('SmaCalculator non-const', () {
      // ignore: prefer_const_constructors
      final calc = SmaCalculator();
      expect(calc, isA<SmaCalculator>());
    });
  });
}
