import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RegressionTrendline', () {
    const uptrend = RegressionTrendline(
      ticker: 'AAPL',
      slope: 0.5,
      intercept: 100.0,
      rSquared: 0.85,
      startIndex: 0,
      endIndex: 19,
      period: 20,
    );

    test('direction is up for positive slope', () {
      expect(uptrend.direction, equals(TrendlineDirection.up));
    });

    test('direction is down for negative slope', () {
      const down = RegressionTrendline(
        ticker: 'X',
        slope: -0.3,
        intercept: 200.0,
        rSquared: 0.6,
        startIndex: 0,
        endIndex: 9,
        period: 10,
      );
      expect(down.direction, equals(TrendlineDirection.down));
    });

    test('direction is flat for slope near zero', () {
      const flat = RegressionTrendline(
        ticker: 'X',
        slope: 0.005,
        intercept: 150.0,
        rSquared: 0.4,
        startIndex: 0,
        endIndex: 9,
        period: 10,
      );
      expect(flat.direction, equals(TrendlineDirection.flat));
    });

    test('isHighConfidence is true when rSquared >= 0.7', () {
      expect(uptrend.isHighConfidence, isTrue);
    });

    test('isHighConfidence is false when rSquared < 0.7', () {
      const lowConf = RegressionTrendline(
        ticker: 'X',
        slope: 0.5,
        intercept: 100.0,
        rSquared: 0.5,
        startIndex: 0,
        endIndex: 9,
        period: 10,
      );
      expect(lowConf.isHighConfidence, isFalse);
    });

    test('priceAt startIndex returns intercept', () {
      expect(uptrend.priceAt(0), closeTo(100.0, 0.001));
    });

    test('priceAt offset bar uses slope correctly', () {
      // bar 4: 0.5 * (4 - 0) + 100 = 102.0
      expect(uptrend.priceAt(4), closeTo(102.0, 0.001));
    });

    test('equality holds for same props', () {
      const a = RegressionTrendline(
        ticker: 'MSFT',
        slope: 0.2,
        intercept: 300,
        rSquared: 0.9,
        startIndex: 0,
        endIndex: 9,
        period: 10,
      );
      const b = RegressionTrendline(
        ticker: 'MSFT',
        slope: 0.2,
        intercept: 300,
        rSquared: 0.9,
        startIndex: 0,
        endIndex: 9,
        period: 10,
      );
      expect(a, equals(b));
    });
  });
}
