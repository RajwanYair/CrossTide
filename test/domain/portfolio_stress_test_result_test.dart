import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PortfolioStressTestResult', () {
    PortfolioStressTestResult buildResult({
      double portfolioReturnPct = -15.0,
      double maxDrawdownPct = 18.0,
    }) {
      return PortfolioStressTestResult(
        scenarioName: '2008 Financial Crisis',
        portfolioReturnPct: portfolioReturnPct,
        maxDrawdownPct: maxDrawdownPct,
        valueAtRisk95Pct: 8.5,
        testedAt: DateTime(2024, 6, 1),
      );
    }

    test('isLossScenario is true when portfolioReturnPct < 0', () {
      expect(buildResult(portfolioReturnPct: -1.0).isLossScenario, isTrue);
    });

    test('isLossScenario is false when portfolioReturnPct >= 0', () {
      expect(buildResult(portfolioReturnPct: 0.0).isLossScenario, isFalse);
    });

    test('isSevere is true when maxDrawdownPct > 20', () {
      expect(buildResult(maxDrawdownPct: 20.1).isSevere, isTrue);
    });

    test('isSevere is false when maxDrawdownPct <= 20', () {
      expect(buildResult(maxDrawdownPct: 20.0).isSevere, isFalse);
    });

    test('equality holds for same props', () {
      expect(buildResult(), equals(buildResult()));
    });
  });
}
