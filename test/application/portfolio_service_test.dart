import 'package:cross_tide/src/application/portfolio_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = PortfolioService();

  final holdings = [
    const PortfolioHolding(
      ticker: 'AAPL',
      shares: 10,
      averageCost: 150,
      currentPrice: 175,
      sector: 'Technology',
    ),
    const PortfolioHolding(
      ticker: 'XOM',
      shares: 20,
      averageCost: 80,
      currentPrice: 90,
      sector: 'Energy',
    ),
  ];

  test('analyze returns summary + risk for valid holdings', () {
    final result = service.analyze(holdings);
    expect(result, isNotNull);
    expect(result!.summary.holdingCount, 2);
    expect(result.summary.totalCost, 10 * 150 + 20 * 80.0);
    expect(result.risk.riskLevel, isNotEmpty);
  });

  test('analyze returns null for empty holdings', () {
    expect(service.analyze([]), isNull);
  });

  test('analyze accepts positionVolatilities', () {
    final result = service.analyze(
      holdings,
      positionVolatilities: {'AAPL': 0.25, 'XOM': 0.18},
    );
    expect(result, isNotNull);
    expect(result!.risk.overallScore, greaterThanOrEqualTo(0));
  });
}
