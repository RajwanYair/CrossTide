import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final baseTime = DateTime(2026, 4, 10, 9, 0);

  group('ProviderSyncState', () {
    final healthy = ProviderSyncState(
      providerId: 'yahoo',
      healthStatus: ProviderHealthStatus.healthy,
      lastSuccessAt: baseTime,
      consecutiveFailures: 0,
      totalRequests: 100,
      totalFailures: 5,
    );

    test('successRate calculates correctly', () {
      expect(healthy.successRate, closeTo(0.95, 0.001));
    });

    test('isCritical is false when consecutiveFailures < 5', () {
      expect(healthy.isCritical, isFalse);
    });

    test('isCritical is true when consecutiveFailures >= 5', () {
      const critical = ProviderSyncState(
        providerId: 'yahoo',
        healthStatus: ProviderHealthStatus.unavailable,
        lastSuccessAt: null,
        consecutiveFailures: 5,
        totalRequests: 50,
        totalFailures: 50,
      );
      expect(critical.isCritical, isTrue);
    });

    test('recordSuccess resets consecutiveFailures and marks healthy', () {
      final degraded = ProviderSyncState(
        providerId: 'yahoo',
        healthStatus: ProviderHealthStatus.degraded,
        lastSuccessAt: baseTime,
        consecutiveFailures: 3,
        totalRequests: 10,
        totalFailures: 3,
      );
      final updated = degraded.recordSuccess(at: baseTime);
      expect(updated.consecutiveFailures, equals(0));
      expect(updated.healthStatus, equals(ProviderHealthStatus.healthy));
      expect(updated.totalRequests, equals(11));
    });

    test('recordFailure increments failures and degrades health', () {
      final updated = healthy.recordFailure();
      expect(updated.consecutiveFailures, equals(1));
      expect(updated.totalFailures, equals(6));
      expect(updated.healthStatus, equals(ProviderHealthStatus.degraded));
    });

    test('recordFailure x5 sets status to unavailable', () {
      ProviderSyncState state = healthy;
      for (int i = 0; i < 5; i++) {
        state = state.recordFailure();
      }
      expect(state.healthStatus, equals(ProviderHealthStatus.unavailable));
    });

    test('successRate is 1.0 when no requests', () {
      const zero = ProviderSyncState(
        providerId: 'p',
        healthStatus: ProviderHealthStatus.healthy,
        lastSuccessAt: null,
        consecutiveFailures: 0,
        totalRequests: 0,
        totalFailures: 0,
      );
      expect(zero.successRate, equals(1.0));
    });
  });
}
