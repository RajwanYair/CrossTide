import 'package:cross_tide/src/domain/portfolio_exposure_breakdown.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PortfolioExposureBreakdown', () {
    test('equality', () {
      const a = PortfolioExposureBreakdown(
        portfolioId: 'port1',
        category: ExposureCategory.equity,
        longPercent: 75.0,
        shortPercent: 5.0,
        netPercent: 70.0,
      );
      const b = PortfolioExposureBreakdown(
        portfolioId: 'port1',
        category: ExposureCategory.equity,
        longPercent: 75.0,
        shortPercent: 5.0,
        netPercent: 70.0,
      );
      expect(a, b);
    });

    test('copyWith changes netPercent', () {
      const base = PortfolioExposureBreakdown(
        portfolioId: 'port1',
        category: ExposureCategory.equity,
        longPercent: 75.0,
        shortPercent: 5.0,
        netPercent: 70.0,
      );
      final updated = base.copyWith(netPercent: 65.0);
      expect(updated.netPercent, 65.0);
    });

    test('props length is 5', () {
      const obj = PortfolioExposureBreakdown(
        portfolioId: 'port1',
        category: ExposureCategory.equity,
        longPercent: 75.0,
        shortPercent: 5.0,
        netPercent: 70.0,
      );
      expect(obj.props.length, 5);
    });
  });
}
