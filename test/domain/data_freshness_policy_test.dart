import 'package:cross_tide/src/domain/data_freshness_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DataFreshnessPolicy', () {
    test('equality', () {
      const a = DataFreshnessPolicy(
        policyId: 'p1',
        dataCategory: 'candles',
        maxAgeSeconds: 3600,
        stalePolicy: StaleDataPolicy.serveStale,
      );
      const b = DataFreshnessPolicy(
        policyId: 'p1',
        dataCategory: 'candles',
        maxAgeSeconds: 3600,
        stalePolicy: StaleDataPolicy.serveStale,
      );
      expect(a, b);
    });

    test('copyWith changes maxAgeSeconds', () {
      const base = DataFreshnessPolicy(
        policyId: 'p1',
        dataCategory: 'candles',
        maxAgeSeconds: 3600,
        stalePolicy: StaleDataPolicy.serveStale,
      );
      final updated = base.copyWith(maxAgeSeconds: 7200);
      expect(updated.maxAgeSeconds, 7200);
    });

    test('props length is 5', () {
      const obj = DataFreshnessPolicy(
        policyId: 'p1',
        dataCategory: 'candles',
        maxAgeSeconds: 3600,
        stalePolicy: StaleDataPolicy.serveStale,
      );
      expect(obj.props.length, 5);
    });
  });
}
