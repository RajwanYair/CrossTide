import 'package:cross_tide/src/domain/signal_reliability_score.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SignalReliabilityScore', () {
    test('equality', () {
      const a = SignalReliabilityScore(
        ticker: 'AAPL',
        method: 'Micho',
        score: 85.0,
        sampleSize: 100,
        grade: ReliabilityGrade.b,
      );
      const b = SignalReliabilityScore(
        ticker: 'AAPL',
        method: 'Micho',
        score: 85.0,
        sampleSize: 100,
        grade: ReliabilityGrade.b,
      );
      expect(a, b);
    });

    test('copyWith changes score', () {
      const base = SignalReliabilityScore(
        ticker: 'AAPL',
        method: 'Micho',
        score: 85.0,
        sampleSize: 100,
        grade: ReliabilityGrade.b,
      );
      final updated = base.copyWith(score: 90.0);
      expect(updated.score, 90.0);
    });

    test('props length is 5', () {
      const obj = SignalReliabilityScore(
        ticker: 'AAPL',
        method: 'Micho',
        score: 85.0,
        sampleSize: 100,
        grade: ReliabilityGrade.b,
      );
      expect(obj.props.length, 5);
    });
  });
}
