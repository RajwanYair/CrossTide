import 'package:equatable/equatable.dart';

/// Health status of a market data provider.
enum ProviderHealthStatus {
  /// Responses are timely and within error thresholds.
  healthy,

  /// Some errors or latency spikes but still usable.
  degraded,

  /// Provider is unreachable or returning consistent errors.
  unavailable,

  /// Rate limit exhausted; requests queued or dropped.
  rateLimit,
}

/// Point-in-time sync state for a single market data provider.
class ProviderSyncState extends Equatable {
  const ProviderSyncState({
    required this.providerId,
    required this.healthStatus,
    required this.lastSuccessAt,
    required this.consecutiveFailures,
    required this.totalRequests,
    required this.totalFailures,
    this.rateLimitResetsAt,
  });

  final String providerId;
  final ProviderHealthStatus healthStatus;

  /// Timestamp of the last successful data fetch. Null if never succeeded.
  final DateTime? lastSuccessAt;

  final int consecutiveFailures;
  final int totalRequests;
  final int totalFailures;

  /// When the rate limit resets. Non-null only when [healthStatus] is
  /// [ProviderHealthStatus.rateLimit].
  final DateTime? rateLimitResetsAt;

  /// Success rate as a fraction (0.0–1.0).
  double get successRate => totalRequests == 0
      ? 1.0
      : (totalRequests - totalFailures) / totalRequests;

  /// True when consecutive failures exceed the degradation threshold.
  bool get isCritical => consecutiveFailures >= 5;

  /// Returns a new state recording one more success.
  ProviderSyncState recordSuccess({required DateTime at}) => ProviderSyncState(
    providerId: providerId,
    healthStatus: ProviderHealthStatus.healthy,
    lastSuccessAt: at,
    consecutiveFailures: 0,
    totalRequests: totalRequests + 1,
    totalFailures: totalFailures,
  );

  /// Returns a new state recording one more failure.
  ProviderSyncState recordFailure() {
    final int newFails = consecutiveFailures + 1;
    return ProviderSyncState(
      providerId: providerId,
      healthStatus: newFails >= 5
          ? ProviderHealthStatus.unavailable
          : ProviderHealthStatus.degraded,
      lastSuccessAt: lastSuccessAt,
      consecutiveFailures: newFails,
      totalRequests: totalRequests + 1,
      totalFailures: totalFailures + 1,
    );
  }

  @override
  List<Object?> get props => [
    providerId,
    healthStatus,
    lastSuccessAt,
    consecutiveFailures,
    totalRequests,
    totalFailures,
    rateLimitResetsAt,
  ];
}
