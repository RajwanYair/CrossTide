import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = RiskParityCalculator();

  group('RiskParityCalculator', () {
    test('compute equal-risk weights', () {
      final result = calc.compute({
        'AAPL': 0.20, // 20% vol
        'MSFT': 0.10, // 10% vol
      });
      expect(result.weights.length, 2);
      // Lower vol gets higher weight
      final msft = result.weights.firstWhere(
        (RiskParityWeight w) => w.ticker == 'MSFT',
      );
      final aapl = result.weights.firstWhere(
        (RiskParityWeight w) => w.ticker == 'AAPL',
      );
      expect(msft.weight, greaterThan(aapl.weight));
    });

    test('weights sum to 1', () {
      final result = calc.compute({'A': 0.15, 'B': 0.25, 'C': 0.10});
      var sum = 0.0;
      for (final RiskParityWeight w in result.weights) {
        sum += w.weight;
      }
      expect(sum, closeTo(1.0, 1e-9));
    });

    test('empty input returns empty', () {
      final result = calc.compute({});
      expect(result.weights, isEmpty);
      expect(result.portfolioVolatility, 0);
    });

    test('zero volatility assets excluded', () {
      final result = calc.compute({'A': 0.10, 'B': 0.0});
      expect(result.weights.length, 1);
    });
  });
}
