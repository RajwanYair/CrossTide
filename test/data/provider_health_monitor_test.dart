import 'package:cross_tide/src/data/data.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ProviderHealthMonitor', () {
    test('records success and failure', () {
      final monitor = ProviderHealthMonitor();
      monitor.recordSuccess('yahoo');
      monitor.recordSuccess('yahoo');
      monitor.recordFailure('yahoo');

      final health = monitor.healthFor('yahoo');
      expect(health.successCount, 2);
      expect(health.failureCount, 1);
      expect(health.consecutiveFailures, 1);
      expect(health.successRate, closeTo(0.667, 0.01));
      expect(health.isHealthy, isTrue);
    });

    test('marks unhealthy after 3 consecutive failures', () {
      final monitor = ProviderHealthMonitor();
      monitor.recordFailure('alpha');
      monitor.recordFailure('alpha');
      monitor.recordFailure('alpha');

      expect(monitor.healthFor('alpha').isHealthy, isFalse);
    });

    test('resets consecutive failures on success', () {
      final monitor = ProviderHealthMonitor();
      monitor.recordFailure('s1');
      monitor.recordFailure('s1');
      monitor.recordSuccess('s1');

      expect(monitor.healthFor('s1').consecutiveFailures, 0);
      expect(monitor.healthFor('s1').isHealthy, isTrue);
    });

    test('ranks providers by success rate', () {
      final monitor = ProviderHealthMonitor();
      monitor.recordSuccess('good');
      monitor.recordSuccess('good');
      monitor.recordFailure('bad');
      monitor.recordFailure('bad');
      monitor.recordSuccess('ok');
      monitor.recordFailure('ok');

      final ranked = monitor.rankedProviders();
      expect(ranked.first, 'good');
      expect(ranked.last, 'bad');
    });

    test('reset clears all counters', () {
      final monitor = ProviderHealthMonitor();
      monitor.recordSuccess('p');
      monitor.recordFailure('p');

      monitor.healthFor('p').reset();
      expect(monitor.healthFor('p').successCount, 0);
      expect(monitor.healthFor('p').failureCount, 0);
    });
  });
}
