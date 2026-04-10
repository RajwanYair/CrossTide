import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SignalScoreComponent', () {
    test('weightedScore is product of score and weight', () {
      const comp = SignalScoreComponent(
        methodName: 'RSI',
        score: 0.8,
        weight: 0.5,
      );
      expect(comp.weightedScore, closeTo(0.4, 0.0001));
    });
  });

  group('CompositeSignalScore', () {
    final evaluatedAt = DateTime(2026, 4, 10);

    test('rawScore averages weighted components', () {
      final score = CompositeSignalScore(
        ticker: 'AAPL',
        components: const [
          SignalScoreComponent(methodName: 'A', score: 1.0, weight: 0.5),
          SignalScoreComponent(methodName: 'B', score: -1.0, weight: 0.5),
        ],
        evaluatedAt: evaluatedAt,
      );
      expect(score.rawScore, closeTo(0.0, 0.0001));
    });

    test('indexScore maps -1..+1 to 0..100', () {
      final bullish = CompositeSignalScore(
        ticker: 'AAPL',
        components: const [
          SignalScoreComponent(methodName: 'A', score: 1.0, weight: 1.0),
        ],
        evaluatedAt: evaluatedAt,
      );
      expect(bullish.indexScore, closeTo(100.0, 0.001));

      final bearish = CompositeSignalScore(
        ticker: 'AAPL',
        components: const [
          SignalScoreComponent(methodName: 'A', score: -1.0, weight: 1.0),
        ],
        evaluatedAt: evaluatedAt,
      );
      expect(bearish.indexScore, closeTo(0.0, 0.001));
    });

    test('grade is veryBullish when indexScore is 90', () {
      final score = CompositeSignalScore(
        ticker: 'AAPL',
        components: const [
          SignalScoreComponent(methodName: 'A', score: 0.8, weight: 1.0),
        ],
        evaluatedAt: evaluatedAt,
      );
      // indexScore = (0.8+1)/2*100 = 90
      expect(score.grade, equals(SignalScoreGrade.veryBullish));
    });

    test('grade is neutral when indexScore is 50', () {
      final score = CompositeSignalScore(
        ticker: 'AAPL',
        components: const [],
        evaluatedAt: evaluatedAt,
      );
      // rawScore = 0, indexScore = 50
      expect(score.grade, equals(SignalScoreGrade.neutral));
    });

    test('grade is veryBearish when indexScore is 10', () {
      final score = CompositeSignalScore(
        ticker: 'AAPL',
        components: const [
          SignalScoreComponent(methodName: 'A', score: -0.8, weight: 1.0),
        ],
        evaluatedAt: evaluatedAt,
      );
      // indexScore = (-0.8+1)/2*100 = 10
      expect(score.grade, equals(SignalScoreGrade.veryBearish));
    });
  });
}
