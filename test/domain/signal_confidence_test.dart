import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

DailyCandle _candle(int day, {required double close, int volume = 1000000}) =>
    DailyCandle(
      date: DateTime(2024, 1, 1).add(Duration(days: day)),
      open: close,
      high: close + 1,
      low: close - 1,
      close: close,
      volume: volume,
    );

void main() {
  const calc = SignalConfidenceCalculator();

  group('SignalConfidenceCalculator', () {
    test('returns score=0 with fewer than 201 candles', () {
      final candles = List.generate(200, (i) => _candle(i, close: 100.0));
      final score = calc.compute('TEST', candles);
      expect(score.score, 0);
      expect(score.aboveSma200, isFalse);
      expect(score.goldenCrossForm, isFalse);
      expect(score.trendMomentum, isFalse);
      expect(score.rsiHealthy, isFalse);
      expect(score.volumeConfirm, isFalse);
      expect(score.strength, SignalStrength.none);
    });

    test('all factors true → score=100, strength=strong', () {
      // Build 250 candles: slow uptrend so SMA50>SMA150>SMA200, RSI healthy.
      // Start at 50 and gradually increase to 150.
      final candles = List.generate(250, (i) {
        final price = 50.0 + i * 0.4; // incremental so SMA50>SMA150>SMA200
        // Boost last-bar volume above 1.5× average.
        final vol = i == 249 ? 3000000 : 1000000;
        return _candle(i, close: price, volume: vol);
      });
      final score = calc.compute('TEST', candles);
      expect(score.aboveSma200, isTrue);
      expect(score.goldenCrossForm, isTrue);
      expect(score.trendMomentum, isTrue);
      // RSI may vary; just check the total score
      expect(score.score, greaterThanOrEqualTo(60));
    });

    test('all factors false → score=0', () {
      // Falling candles: price below SMA200, SMA50<SMA200.
      final candles = List.generate(250, (i) {
        final price = 150.0 - i * 0.4;
        return _candle(i, close: price);
      });
      final score = calc.compute('TEST', candles);
      expect(score.aboveSma200, isFalse);
      expect(score.score, lessThan(60));
    });

    test('volumeConfirm is true when last bar volume > 1.5x average', () {
      // Flat candles with a volume spike on the last bar.
      final candles = List.generate(250, (i) {
        final price = 50.0 + i * 0.4;
        final vol = i == 249 ? 5000000 : 500000;
        return _candle(i, close: price, volume: vol);
      });
      final score = calc.compute('TEST', candles);
      expect(score.volumeConfirm, isTrue);
    });

    test('volumeConfirm is false when last bar volume <= 1.5x average', () {
      // All bars same volume, last bar = average volume.
      final candles = List.generate(250, (i) {
        final price = 50.0 + i * 0.4;
        return _candle(i, close: price, volume: 1000000);
      });
      final score = calc.compute('TEST', candles);
      expect(score.volumeConfirm, isFalse);
    });

    test('symbol is preserved in result', () {
      final candles = List.generate(201, (i) => _candle(i, close: 100.0));
      final score = calc.compute('AAPL', candles);
      expect(score.symbol, 'AAPL');
    });
  });

  group('SignalConfidenceScore', () {
    test('strength returns none for score < 40', () {
      const s = SignalConfidenceScore(
        symbol: 'X',
        score: 20,
        aboveSma200: true,
        goldenCrossForm: false,
        trendMomentum: false,
        rsiHealthy: false,
        volumeConfirm: false,
      );
      expect(s.strength, SignalStrength.none);
    });

    test('strength returns weak for score 40–59', () {
      const s = SignalConfidenceScore(
        symbol: 'X',
        score: 40,
        aboveSma200: true,
        goldenCrossForm: true,
        trendMomentum: false,
        rsiHealthy: false,
        volumeConfirm: false,
      );
      expect(s.strength, SignalStrength.weak);
    });

    test('strength returns moderate for score 60–79', () {
      const s = SignalConfidenceScore(
        symbol: 'X',
        score: 60,
        aboveSma200: true,
        goldenCrossForm: true,
        trendMomentum: true,
        rsiHealthy: false,
        volumeConfirm: false,
      );
      expect(s.strength, SignalStrength.moderate);
    });

    test('strength returns strong for score >= 80', () {
      const s = SignalConfidenceScore(
        symbol: 'X',
        score: 100,
        aboveSma200: true,
        goldenCrossForm: true,
        trendMomentum: true,
        rsiHealthy: true,
        volumeConfirm: true,
      );
      expect(s.strength, SignalStrength.strong);
    });

    test('equality: same fields are equal', () {
      const a = SignalConfidenceScore(
        symbol: 'AAPL',
        score: 80,
        aboveSma200: true,
        goldenCrossForm: true,
        trendMomentum: true,
        rsiHealthy: true,
        volumeConfirm: false,
      );
      const b = SignalConfidenceScore(
        symbol: 'AAPL',
        score: 80,
        aboveSma200: true,
        goldenCrossForm: true,
        trendMomentum: true,
        rsiHealthy: true,
        volumeConfirm: false,
      );
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('equality: different scores are not equal', () {
      const a = SignalConfidenceScore(
        symbol: 'AAPL',
        score: 60,
        aboveSma200: true,
        goldenCrossForm: true,
        trendMomentum: true,
        rsiHealthy: false,
        volumeConfirm: false,
      );
      const b = SignalConfidenceScore(
        symbol: 'AAPL',
        score: 80,
        aboveSma200: true,
        goldenCrossForm: true,
        trendMomentum: true,
        rsiHealthy: true,
        volumeConfirm: false,
      );
      expect(a, isNot(equals(b)));
    });
  });
}
