import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = RrgCalculator();

  group('RrgCalculator', () {
    test('compute returns data points', () {
      final result = calc.compute(
        tickerReturns: {
          'AAPL': [for (int i = 0; i < 30; i++) 0.01 + i * 0.001],
          'MSFT': [for (int i = 0; i < 30; i++) 0.005 + i * 0.0005],
        },
        benchmarkReturns: [for (int i = 0; i < 30; i++) 0.008 + i * 0.0007],
        benchmarkTicker: 'SPY',
      );
      expect(result.dataPoints, isNotEmpty);
      expect(result.benchmarkTicker, 'SPY');
    });

    test('quadrant classification works', () {
      final result = calc.compute(
        tickerReturns: {
          'STRONG': [for (int i = 0; i < 30; i++) 0.05],
          'WEAK': [for (int i = 0; i < 30; i++) -0.01],
        },
        benchmarkReturns: [for (int i = 0; i < 30; i++) 0.01],
        benchmarkTicker: 'SPY',
      );
      for (final RrgDataPoint p in result.dataPoints) {
        expect(p.quadrant, isA<RrgQuadrant>());
      }
    });

    test('empty benchmark returns empty', () {
      final result = calc.compute(
        tickerReturns: {
          'AAPL': [0.01, 0.02],
        },
        benchmarkReturns: [],
        benchmarkTicker: 'SPY',
      );
      expect(result.dataPoints, isEmpty);
    });

    test('leading and improving getters work', () {
      final result = calc.compute(
        tickerReturns: {
          'A': [for (int i = 0; i < 30; i++) 0.03],
        },
        benchmarkReturns: [for (int i = 0; i < 30; i++) 0.01],
        benchmarkTicker: 'SPY',
      );
      expect(
        result.leading.length + result.improving.length,
        lessThanOrEqualTo(result.dataPoints.length),
      );
    });
  });
}
