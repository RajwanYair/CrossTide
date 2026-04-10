import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TickerPriceRange', () {
    const range = TickerPriceRange(
      ticker: 'AAPL',
      currentPrice: 150.0,
      week52High: 200.0,
      week52Low: 100.0,
      allTimeHigh: 250.0,
    );

    test('isAtAllTimeHigh is false when below ATH', () {
      expect(range.isAtAllTimeHigh, isFalse);
    });

    test('isAtAllTimeHigh is true when at ATH', () {
      const atAth = TickerPriceRange(
        ticker: 'AAPL',
        currentPrice: 250.0,
        week52High: 250.0,
        week52Low: 100.0,
        allTimeHigh: 250.0,
      );
      expect(atAth.isAtAllTimeHigh, isTrue);
    });

    test('pctFrom52WeekHigh is negative when below high', () {
      // (150 - 200) / 200 * 100 = -25%
      expect(range.pctFrom52WeekHigh, closeTo(-25.0, 0.001));
    });

    test('pctFrom52WeekLow is positive when above low', () {
      // (150 - 100) / 100 * 100 = 50%
      expect(range.pctFrom52WeekLow, closeTo(50.0, 0.001));
    });

    test('positionIn52WeekRange returns 0.5 for midpoint', () {
      // (150 - 100) / (200 - 100) = 0.5
      expect(range.positionIn52WeekRange, closeTo(0.5, 0.001));
    });

    test('positionIn52WeekRange returns 0.5 when span is zero', () {
      const flat = TickerPriceRange(
        ticker: 'X',
        currentPrice: 100,
        week52High: 100,
        week52Low: 100,
        allTimeHigh: 100,
      );
      expect(flat.positionIn52WeekRange, equals(0.5));
    });

    test('isAt52WeekHigh is true at boundary', () {
      const atHigh = TickerPriceRange(
        ticker: 'X',
        currentPrice: 200.0,
        week52High: 200.0,
        week52Low: 100.0,
        allTimeHigh: 250.0,
      );
      expect(atHigh.isAt52WeekHigh, isTrue);
    });

    test('equality holds for same props', () {
      const a = TickerPriceRange(
        ticker: 'MSFT',
        currentPrice: 300,
        week52High: 400,
        week52Low: 200,
        allTimeHigh: 450,
      );
      const b = TickerPriceRange(
        ticker: 'MSFT',
        currentPrice: 300,
        week52High: 400,
        week52Low: 200,
        allTimeHigh: 450,
      );
      expect(a, equals(b));
    });
  });
}
