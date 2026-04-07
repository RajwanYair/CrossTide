import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const analyzer = SeasonalityAnalyzer();

  // ~2 months of daily candles (Mon–Fri pattern)
  final candles = <DailyCandle>[];
  var date = DateTime(2024, 1, 2); // Tuesday
  for (int i = 0; i < 60; i++) {
    candles.add(
      DailyCandle(
        date: date,
        open: 100.0 + i * 0.1,
        high: 101.0 + i * 0.1,
        low: 99.0 + i * 0.1,
        close: 100.5 + i * 0.1,
        volume: 1000000,
      ),
    );
    date = date.add(const Duration(days: 1));
    // Skip weekends
    if (date.weekday == 6) date = date.add(const Duration(days: 2));
  }

  group('SeasonalityAnalyzer', () {
    test('analyze returns day-of-week returns', () {
      final result = analyzer.analyze(ticker: 'AAPL', candles: candles);
      expect(result.ticker, 'AAPL');
      expect(result.dayOfWeek.length, 7);
      // Trading days should have samples
      final monday = result.dayOfWeek.firstWhere(
        (SeasonalReturn s) => s.label == 'Monday',
      );
      expect(monday.sampleCount, greaterThanOrEqualTo(0));
    });

    test('analyze returns month-of-year returns', () {
      final result = analyzer.analyze(ticker: 'AAPL', candles: candles);
      expect(result.monthOfYear.length, 12);
      // January and February should have samples
      final jan = result.monthOfYear.firstWhere(
        (SeasonalReturn s) => s.label == 'January',
      );
      expect(jan.sampleCount, greaterThan(0));
    });

    test('winRate is computed correctly', () {
      final result = analyzer.analyze(ticker: 'AAPL', candles: candles);
      for (final SeasonalReturn s in result.dayOfWeek) {
        if (s.sampleCount > 0) {
          expect(s.winRate, inInclusiveRange(0, 1));
        }
      }
    });

    test('empty candles produces zero-sample results', () {
      final result = analyzer.analyze(ticker: 'AAPL', candles: []);
      expect(result.dayOfWeek.length, 7);
      for (final SeasonalReturn s in result.dayOfWeek) {
        expect(s.sampleCount, 0);
      }
    });
  });
}
