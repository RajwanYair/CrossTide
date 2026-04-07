import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const analyzer = SignalStreakAnalyzer();

  final signals = [
    DatedSignal(
      date: DateTime(2025, 1, 1),
      direction: StreakDirection.buy,
      method: 'micho',
    ),
    DatedSignal(
      date: DateTime(2025, 1, 2),
      direction: StreakDirection.buy,
      method: 'rsi',
    ),
    DatedSignal(
      date: DateTime(2025, 1, 3),
      direction: StreakDirection.buy,
      method: 'macd',
    ),
    DatedSignal(
      date: DateTime(2025, 1, 4),
      direction: StreakDirection.sell,
      method: 'micho',
    ),
    DatedSignal(
      date: DateTime(2025, 1, 5),
      direction: StreakDirection.sell,
      method: 'rsi',
    ),
  ];

  group('SignalStreakAnalyzer', () {
    test('analyze detects streaks', () {
      final result = analyzer.analyze(ticker: 'AAPL', signals: signals);
      expect(result.ticker, 'AAPL');
      expect(result.totalStreaks, 2); // 3 buys + 2 sells
    });

    test('longestBuyStreak is 3', () {
      final result = analyzer.analyze(ticker: 'AAPL', signals: signals);
      expect(result.longestBuyStreak.length, 3);
      expect(result.longestBuyStreak.direction, StreakDirection.buy);
    });

    test('longestSellStreak is 2', () {
      final result = analyzer.analyze(ticker: 'AAPL', signals: signals);
      expect(result.longestSellStreak.length, 2);
    });

    test('currentStreak is sell direction', () {
      final result = analyzer.analyze(ticker: 'AAPL', signals: signals);
      expect(result.currentStreak.direction, StreakDirection.sell);
    });

    test('empty signals produces empty streaks', () {
      final result = analyzer.analyze(ticker: 'AAPL', signals: []);
      expect(result.totalStreaks, 0);
      expect(result.currentStreak.direction, StreakDirection.none);
    });

    test('streaks track contributing methods', () {
      final result = analyzer.analyze(ticker: 'AAPL', signals: signals);
      expect(
        result.longestBuyStreak.methods,
        containsAll(['micho', 'rsi', 'macd']),
      );
    });
  });
}
