import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertHistogramBucket', () {
    test('equality holds for same props', () {
      const a = AlertHistogramBucket(hourOfDay: 9, alertCount: 5);
      const b = AlertHistogramBucket(hourOfDay: 9, alertCount: 5);
      expect(a, equals(b));
    });
  });

  group('TickerAlertHistogram', () {
    const buckets = [
      AlertHistogramBucket(hourOfDay: 9, alertCount: 10),
      AlertHistogramBucket(hourOfDay: 14, alertCount: 5),
      AlertHistogramBucket(hourOfDay: 16, alertCount: 8),
    ];

    const histogram = TickerAlertHistogram(
      ticker: 'AAPL',
      buckets: buckets,
      totalAlerts: 23,
    );

    test('peakHour returns bucket with highest alertCount', () {
      expect(histogram.peakHour?.hourOfDay, 9);
    });

    test('countAt returns alert count for existing hour', () {
      expect(histogram.countAt(14), 5);
    });

    test('countAt returns 0 for hour with no bucket', () {
      expect(histogram.countAt(1), 0);
    });

    test('peakHour is null for empty histogram', () {
      const empty = TickerAlertHistogram(
        ticker: 'X',
        buckets: [],
        totalAlerts: 0,
      );
      expect(empty.peakHour, isNull);
    });

    test('equality holds for same props', () {
      const copy = TickerAlertHistogram(
        ticker: 'AAPL',
        buckets: buckets,
        totalAlerts: 23,
      );
      expect(histogram, equals(copy));
    });
  });
}
