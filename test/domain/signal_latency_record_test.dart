import 'package:cross_tide/src/domain/signal_latency_record.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SignalLatencyRecord', () {
    test('equality', () {
      const a = SignalLatencyRecord(
        ticker: 'AAPL',
        method: 'Micho',
        detectionMs: 45,
        deliveryMs: 120,
        bucket: LatencyBucket.normal,
      );
      const b = SignalLatencyRecord(
        ticker: 'AAPL',
        method: 'Micho',
        detectionMs: 45,
        deliveryMs: 120,
        bucket: LatencyBucket.normal,
      );
      expect(a, b);
    });

    test('copyWith changes detectionMs', () {
      const base = SignalLatencyRecord(
        ticker: 'AAPL',
        method: 'Micho',
        detectionMs: 45,
        deliveryMs: 120,
        bucket: LatencyBucket.normal,
      );
      final updated = base.copyWith(detectionMs: 30);
      expect(updated.detectionMs, 30);
    });

    test('props length is 5', () {
      const obj = SignalLatencyRecord(
        ticker: 'AAPL',
        method: 'Micho',
        detectionMs: 45,
        deliveryMs: 120,
        bucket: LatencyBucket.normal,
      );
      expect(obj.props.length, 5);
    });
  });
}
