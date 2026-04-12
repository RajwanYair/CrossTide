import 'package:cross_tide/src/domain/quote_quality_metric.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('QuoteQualityMetric', () {
    test('equality', () {
      final a = QuoteQualityMetric(
        ticker: 'AAPL',
        providerName: 'YahooFinance',
        isRealTime: false,
        delaySeconds: 900,
        spreadPercent: 0.03,
        stalePriceFlag: false,
        measuredAt: DateTime(2025, 8, 1),
      );
      final b = QuoteQualityMetric(
        ticker: 'AAPL',
        providerName: 'YahooFinance',
        isRealTime: false,
        delaySeconds: 900,
        spreadPercent: 0.03,
        stalePriceFlag: false,
        measuredAt: DateTime(2025, 8, 1),
      );
      expect(a, b);
    });

    test('copyWith changes delaySeconds', () {
      final base = QuoteQualityMetric(
        ticker: 'AAPL',
        providerName: 'YahooFinance',
        isRealTime: false,
        delaySeconds: 900,
        spreadPercent: 0.03,
        stalePriceFlag: false,
        measuredAt: DateTime(2025, 8, 1),
      );
      final updated = base.copyWith(delaySeconds: 0);
      expect(updated.delaySeconds, 0);
    });

    test('props length is 7', () {
      final obj = QuoteQualityMetric(
        ticker: 'AAPL',
        providerName: 'YahooFinance',
        isRealTime: false,
        delaySeconds: 900,
        spreadPercent: 0.03,
        stalePriceFlag: false,
        measuredAt: DateTime(2025, 8, 1),
      );
      expect(obj.props.length, 7);
    });
  });
}
