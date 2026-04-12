import 'package:cross_tide/src/domain/implied_move_estimate.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ImpliedMoveEstimate', () {
    test('equality', () {
      final a = ImpliedMoveEstimate(
        ticker: 'AMZN',
        eventDate: DateTime(2025, 4, 25),
        impliedMovePercent: 8.0,
        upperPriceTarget: 216.0,
        lowerPriceTarget: 184.0,
        currentPrice: 200.0,
        calculatedAt: DateTime(2025, 4, 20),
      );
      final b = ImpliedMoveEstimate(
        ticker: 'AMZN',
        eventDate: DateTime(2025, 4, 25),
        impliedMovePercent: 8.0,
        upperPriceTarget: 216.0,
        lowerPriceTarget: 184.0,
        currentPrice: 200.0,
        calculatedAt: DateTime(2025, 4, 20),
      );
      expect(a, b);
    });

    test('copyWith changes impliedMovePercent', () {
      final base = ImpliedMoveEstimate(
        ticker: 'AMZN',
        eventDate: DateTime(2025, 4, 25),
        impliedMovePercent: 8.0,
        upperPriceTarget: 216.0,
        lowerPriceTarget: 184.0,
        currentPrice: 200.0,
        calculatedAt: DateTime(2025, 4, 20),
      );
      final updated = base.copyWith(impliedMovePercent: 10.0);
      expect(updated.impliedMovePercent, 10.0);
    });

    test('props length is 8', () {
      final obj = ImpliedMoveEstimate(
        ticker: 'AMZN',
        eventDate: DateTime(2025, 4, 25),
        impliedMovePercent: 8.0,
        upperPriceTarget: 216.0,
        lowerPriceTarget: 184.0,
        currentPrice: 200.0,
        calculatedAt: DateTime(2025, 4, 20),
      );
      expect(obj.props.length, 8);
    });
  });
}
