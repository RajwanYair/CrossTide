import 'package:equatable/equatable.dart';

/// Strategy for handling API rate limit exhaustion.
enum RateLimitStrategy { queue, drop, fallback }

/// A rate-limit policy for a single API provider.
class ApiRateLimitPolicy extends Equatable {
  const ApiRateLimitPolicy({
    required this.providerName,
    required this.maxRequestsPerMinute,
    required this.maxRequestsPerHour,
    required this.strategy,
    this.burstAllowance = 0,
    this.retryAfterSeconds = 60,
  }) : assert(maxRequestsPerMinute > 0, 'maxRequestsPerMinute must be > 0'),
       assert(maxRequestsPerHour > 0, 'maxRequestsPerHour must be > 0'),
       assert(burstAllowance >= 0, 'burstAllowance must be >= 0'),
       assert(retryAfterSeconds > 0, 'retryAfterSeconds must be > 0');

  final String providerName;
  final int maxRequestsPerMinute;
  final int maxRequestsPerHour;
  final RateLimitStrategy strategy;
  final int burstAllowance;
  final int retryAfterSeconds;

  /// Effective per-minute capacity including burst.
  int get effectiveCapacityPerMinute => maxRequestsPerMinute + burstAllowance;

  /// Whether this policy allows fallback on exhaustion.
  bool get allowsFallback => strategy == RateLimitStrategy.fallback;

  /// Whether the given request count is within the per-minute limit.
  bool isWithinMinuteLimit(int requestCount) =>
      requestCount <= effectiveCapacityPerMinute;

  /// Whether the given request count is within the per-hour limit.
  bool isWithinHourLimit(int requestCount) =>
      requestCount <= maxRequestsPerHour;

  ApiRateLimitPolicy withStrategy(RateLimitStrategy newStrategy) =>
      ApiRateLimitPolicy(
        providerName: providerName,
        maxRequestsPerMinute: maxRequestsPerMinute,
        maxRequestsPerHour: maxRequestsPerHour,
        strategy: newStrategy,
        burstAllowance: burstAllowance,
        retryAfterSeconds: retryAfterSeconds,
      );

  @override
  List<Object?> get props => [
    providerName,
    maxRequestsPerMinute,
    maxRequestsPerHour,
    strategy,
    burstAllowance,
    retryAfterSeconds,
  ];
}
