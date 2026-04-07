import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = MarketBreadthCalculator();

  final inputs = [
    const TickerBreadthInput(
      ticker: 'AAPL',
      previousClose: 150,
      currentClose: 155,
      fiftyTwoWeekHigh: 160,
      fiftyTwoWeekLow: 120,
    ),
    const TickerBreadthInput(
      ticker: 'MSFT',
      previousClose: 300,
      currentClose: 295,
      fiftyTwoWeekHigh: 310,
      fiftyTwoWeekLow: 250,
    ),
    const TickerBreadthInput(
      ticker: 'GOOG',
      previousClose: 140,
      currentClose: 140,
      fiftyTwoWeekHigh: 140,
      fiftyTwoWeekLow: 100,
    ),
  ];

  group('MarketBreadthCalculator', () {
    test('compute counts advances/declines/unchanged', () {
      final result = calc.compute(inputs);
      expect(result.advances, 1);
      expect(result.declines, 1);
      expect(result.unchanged, 1);
      expect(result.total, 3);
    });

    test('compute detects 52-week high', () {
      final result = calc.compute(inputs);
      expect(result.newHighs, 1); // GOOG at 140 == 52w high
    });

    test('advance/decline ratio computed correctly', () {
      final result = calc.compute(inputs);
      expect(result.advanceDeclineRatio, 1.0); // 1 adv / 1 dec
    });

    test('breadthThrust computed correctly', () {
      final result = calc.compute(inputs);
      expect(result.breadthThrust, 0.5); // 1 / (1 + 1)
    });

    test('empty inputs returns zeros', () {
      final result = calc.compute([]);
      expect(result.advances, 0);
      expect(result.total, 0);
    });
  });
}
