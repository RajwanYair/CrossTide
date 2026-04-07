import 'package:cross_tide/src/application/cost_basis_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = CostBasisService();

  final trades = [
    TradeEntry(
      ticker: 'AAPL',
      executedAt: DateTime(2025, 1, 10),
      direction: TradeDirection.buy,
      shares: 10,
      pricePerShare: 150.0,
    ),
    TradeEntry(
      ticker: 'AAPL',
      executedAt: DateTime(2025, 3, 15),
      direction: TradeDirection.buy,
      shares: 5,
      pricePerShare: 165.0,
    ),
  ];

  test('compute returns cost basis result', () {
    final result = service.compute(trades);
    expect(result.totalShares, 15);
    expect(result.averageCost, closeTo(155.0, 0.1));
  });

  test('computeAll returns map of ticker to results', () {
    final results = service.computeAll({'AAPL': trades});
    expect(results.containsKey('AAPL'), isTrue);
    expect(results['AAPL']!.totalShares, 15);
  });
}
