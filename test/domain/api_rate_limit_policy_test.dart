import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ApiRateLimitPolicy', () {
    const ApiRateLimitPolicy policy = ApiRateLimitPolicy(
      providerName: 'yahoo',
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 200,
      strategy: RateLimitStrategy.queue,
      burstAllowance: 5,
      retryAfterSeconds: 30,
    );

    test('effectiveCapacityPerMinute includes burst', () {
      expect(policy.effectiveCapacityPerMinute, 15);
    });

    test('allowsFallback false when strategy is queue', () {
      expect(policy.allowsFallback, isFalse);
    });

    test('allowsFallback true when strategy is fallback', () {
      const ApiRateLimitPolicy fb = ApiRateLimitPolicy(
        providerName: 'x',
        maxRequestsPerMinute: 5,
        maxRequestsPerHour: 100,
        strategy: RateLimitStrategy.fallback,
      );
      expect(fb.allowsFallback, isTrue);
    });

    test('isWithinMinuteLimit true when under capacity', () {
      expect(policy.isWithinMinuteLimit(10), isTrue);
    });

    test('isWithinMinuteLimit false when at capacity', () {
      expect(policy.isWithinMinuteLimit(16), isFalse);
    });

    test('isWithinHourLimit works', () {
      expect(policy.isWithinHourLimit(200), isTrue);
      expect(policy.isWithinHourLimit(201), isFalse);
    });

    test('withStrategy returns copy', () {
      final ApiRateLimitPolicy modified = policy.withStrategy(
        RateLimitStrategy.drop,
      );
      expect(modified.strategy, RateLimitStrategy.drop);
      expect(policy.strategy, RateLimitStrategy.queue);
    });

    test('equality', () {
      const ApiRateLimitPolicy same = ApiRateLimitPolicy(
        providerName: 'yahoo',
        maxRequestsPerMinute: 10,
        maxRequestsPerHour: 200,
        strategy: RateLimitStrategy.queue,
        burstAllowance: 5,
        retryAfterSeconds: 30,
      );
      expect(policy, same);
    });
  });
}
