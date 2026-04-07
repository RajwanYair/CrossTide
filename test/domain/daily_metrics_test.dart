import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DailyMetrics', () {
    final date = DateTime(2024, 6, 15);

    test('const constructor and props', () {
      final m1 = DailyMetrics(
        ticker: 'AAPL',
        date: DateTime(2024, 6, 15),
        close: 150.0,
      );
      final m2 = DailyMetrics(
        ticker: 'AAPL',
        date: DateTime(2024, 6, 15),
        close: 150.0,
      );
      expect(m1, equals(m2));
    });

    test('distanceFromSma200 positive when above', () {
      final dm = DailyMetrics(
        ticker: 'AAPL',
        date: date,
        close: 220,
        sma200: 200,
      );
      expect(dm.distanceFromSma200, closeTo(10.0, 0.01));
    });

    test('distanceFromSma200 negative when below', () {
      final dm = DailyMetrics(
        ticker: 'AAPL',
        date: date,
        close: 180,
        sma200: 200,
      );
      expect(dm.distanceFromSma200, closeTo(-10.0, 0.01));
    });

    test('distanceFromSma200 null when sma200 is null', () {
      final dm = DailyMetrics(ticker: 'AAPL', date: date, close: 150);
      expect(dm.distanceFromSma200, isNull);
    });

    test('distanceFromSma200 null when sma200 is zero', () {
      final dm = DailyMetrics(
        ticker: 'AAPL',
        date: date,
        close: 150,
        sma200: 0,
      );
      expect(dm.distanceFromSma200, isNull);
    });

    test('toJson includes all non-null fields', () {
      final dm = DailyMetrics(
        ticker: 'AAPL',
        date: date,
        close: 150,
        sma50: 148,
        sma150: 145,
        sma200: 140,
        rsi: 55.3,
        macdLine: 2.5,
        macdSignal: 1.8,
        atr: 3.2,
        volume: 5000000,
        avgVolume20: 4000000,
        alertsFired: 2,
      );
      final json = dm.toJson();
      expect(json['ticker'], 'AAPL');
      expect(json['date'], '2024-06-15');
      expect(json['close'], 150);
      expect(json['sma50'], 148);
      expect(json['sma150'], 145);
      expect(json['sma200'], 140);
      expect(json['rsi'], 55.3);
      expect(json['macdLine'], 2.5);
      expect(json['macdSignal'], 1.8);
      expect(json['atr'], 3.2);
      expect(json['volume'], 5000000);
      expect(json['avgVolume20'], 4000000);
      expect(json['alertsFired'], 2);
    });

    test('toJson omits null fields', () {
      final dm = DailyMetrics(ticker: 'AAPL', date: date, close: 150);
      final json = dm.toJson();
      expect(json.containsKey('sma50'), isFalse);
      expect(json.containsKey('rsi'), isFalse);
      expect(json.containsKey('volume'), isFalse);
      expect(json['alertsFired'], 0);
    });

    test('alertsFired defaults to 0', () {
      final dm = DailyMetrics(ticker: 'AAPL', date: date, close: 100);
      expect(dm.alertsFired, 0);
    });
  });
}
