import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const estimator = DrawdownRecoveryEstimator();

  final candles = [
    for (int i = 0; i < 200; i++)
      DailyCandle(
        date: DateTime(2023, 1, 1).add(Duration(days: i)),
        open: 100.0 + 10 * _sinApprox(i / 30.0),
        high: 102.0 + 10 * _sinApprox(i / 30.0),
        low: 98.0 + 10 * _sinApprox(i / 30.0),
        close: 100.0 + 10 * _sinApprox(i / 30.0),
        volume: 1000000,
      ),
  ];

  group('DrawdownRecoveryEstimator', () {
    test('estimate computes return needed', () {
      final result = estimator.estimate(
        ticker: 'AAPL',
        candles: candles,
        currentDrawdownPct: -20,
      );
      expect(result.drawdownPct, -20);
      expect(result.returnNeededPct, closeTo(25.0, 0.1));
    });

    test('50% drawdown needs 100% recovery', () {
      final result = estimator.estimate(
        ticker: 'AAPL',
        candles: candles,
        currentDrawdownPct: -50,
      );
      expect(result.returnNeededPct, closeTo(100.0, 0.1));
    });

    test('minimal drawdown needs minimal recovery', () {
      final result = estimator.estimate(
        ticker: 'AAPL',
        candles: candles,
        currentDrawdownPct: -1,
      );
      expect(result.returnNeededPct, closeTo(1.01, 0.1));
    });

    test('estimatedDays is positive', () {
      final result = estimator.estimate(
        ticker: 'AAPL',
        candles: candles,
        currentDrawdownPct: -10,
      );
      expect(result.estimatedDays, greaterThan(0));
    });
  });
}

/// Simple sine approximation (Taylor series, pure Dart).
double _sinApprox(double x) {
  // Normalize to [-π, π] range
  while (x > 3.14159) {
    x -= 6.28318;
  }
  while (x < -3.14159) {
    x += 6.28318;
  }
  final x3 = x * x * x;
  final x5 = x3 * x * x;
  return x - x3 / 6 + x5 / 120;
}
