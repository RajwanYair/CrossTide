import 'package:cross_tide/src/domain/market_data_gap.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketDataGap', () {
    test('equality', () {
      const a = MarketDataGap(
        ticker: 'AAPL',
        fromDate: '2025-01-06',
        toDate: '2025-01-07',
        missingCandles: 2,
        severity: GapSeverity.minor,
      );
      const b = MarketDataGap(
        ticker: 'AAPL',
        fromDate: '2025-01-06',
        toDate: '2025-01-07',
        missingCandles: 2,
        severity: GapSeverity.minor,
      );
      expect(a, b);
    });

    test('copyWith changes missingCandles', () {
      const base = MarketDataGap(
        ticker: 'AAPL',
        fromDate: '2025-01-06',
        toDate: '2025-01-07',
        missingCandles: 2,
        severity: GapSeverity.minor,
      );
      final updated = base.copyWith(missingCandles: 5);
      expect(updated.missingCandles, 5);
    });

    test('props length is 5', () {
      const obj = MarketDataGap(
        ticker: 'AAPL',
        fromDate: '2025-01-06',
        toDate: '2025-01-07',
        missingCandles: 2,
        severity: GapSeverity.minor,
      );
      expect(obj.props.length, 5);
    });
  });
}
