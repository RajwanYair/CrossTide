import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DataProviderMetrics', () {
    final DataProviderMetrics healthy = DataProviderMetrics(
      providerName: 'yahoo',
      status: DataProviderStatus.healthy,
      totalRequests: 100,
      successfulRequests: 95,
      avgLatencyMs: 120.0,
      measuredAt: DateTime(2025, 1, 1),
    );

    test('failedRequests computed', () {
      expect(healthy.failedRequests, 5);
    });

    test('successRate', () {
      expect(healthy.successRate, closeTo(0.95, 0.001));
    });

    test('successRatePercent', () {
      expect(healthy.successRatePercent, closeTo(95.0, 0.1));
    });

    test('isHealthy true', () {
      expect(healthy.isHealthy, isTrue);
    });

    test('hasCriticalFailures false when consecutiveFailures < 5', () {
      expect(healthy.hasCriticalFailures, isFalse);
    });

    test('recordSuccess increments counts and resets failures', () {
      final DataProviderMetrics updated = healthy.recordSuccess(
        latencyMs: 100.0,
      );
      expect(updated.totalRequests, 101);
      expect(updated.successfulRequests, 96);
      expect(updated.consecutiveFailures, 0);
      expect(updated.status, DataProviderStatus.healthy);
    });

    test('recordFailure increments failures and degrades status', () {
      final DataProviderMetrics degraded = healthy.recordFailure(
        errorMessage: 'timeout',
      );
      expect(degraded.consecutiveFailures, 1);
      expect(degraded.status, DataProviderStatus.degraded);
      expect(degraded.lastErrorMessage, 'timeout');
    });

    test('recordFailure 5x marks unavailable', () {
      DataProviderMetrics m = healthy;
      for (int i = 0; i < 5; i++) {
        m = m.recordFailure(errorMessage: 'err');
      }
      expect(m.status, DataProviderStatus.unavailable);
    });

    test('successRate is 1.0 when no requests', () {
      final DataProviderMetrics empty = DataProviderMetrics(
        providerName: 'test',
        status: DataProviderStatus.healthy,
        totalRequests: 0,
        successfulRequests: 0,
        avgLatencyMs: 0,
        measuredAt: DateTime(2025, 1, 1),
      );
      expect(empty.successRate, 1.0);
    });

    test('equality', () {
      final DataProviderMetrics same = DataProviderMetrics(
        providerName: 'yahoo',
        status: DataProviderStatus.healthy,
        totalRequests: 100,
        successfulRequests: 95,
        avgLatencyMs: 120.0,
        measuredAt: DateTime(2025, 1, 1),
      );
      expect(healthy, same);
    });
  });
}
