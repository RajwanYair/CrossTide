import 'package:equatable/equatable.dart';

/// Health status of a market data provider.
enum DataProviderStatus { healthy, degraded, unavailable }

/// Per-provider data quality and performance metrics.
class DataProviderMetrics extends Equatable {
  const DataProviderMetrics({
    required this.providerName,
    required this.status,
    required this.totalRequests,
    required this.successfulRequests,
    required this.avgLatencyMs,
    required this.measuredAt,
    this.lastErrorMessage,
    this.consecutiveFailures = 0,
  }) : assert(totalRequests >= 0, 'totalRequests must be >= 0'),
       assert(successfulRequests >= 0, 'successfulRequests must be >= 0'),
       assert(avgLatencyMs >= 0, 'avgLatencyMs must be >= 0'),
       assert(consecutiveFailures >= 0, 'consecutiveFailures must be >= 0');

  final String providerName;
  final DataProviderStatus status;
  final int totalRequests;
  final int successfulRequests;
  final double avgLatencyMs;
  final DateTime measuredAt;
  final String? lastErrorMessage;
  final int consecutiveFailures;

  int get failedRequests => totalRequests - successfulRequests;

  /// Success rate as a fraction 0.0–1.0.
  double get successRate =>
      totalRequests == 0 ? 1.0 : successfulRequests / totalRequests;

  /// Success rate as a percentage 0–100.
  double get successRatePercent => successRate * 100;

  bool get isHealthy => status == DataProviderStatus.healthy;
  bool get hasCriticalFailures => consecutiveFailures >= 5;

  DataProviderMetrics recordSuccess({required double latencyMs}) =>
      DataProviderMetrics(
        providerName: providerName,
        status: DataProviderStatus.healthy,
        totalRequests: totalRequests + 1,
        successfulRequests: successfulRequests + 1,
        avgLatencyMs:
            (avgLatencyMs * totalRequests + latencyMs) / (totalRequests + 1),
        measuredAt: measuredAt,
        consecutiveFailures: 0,
      );

  DataProviderMetrics recordFailure({required String errorMessage}) =>
      DataProviderMetrics(
        providerName: providerName,
        status: consecutiveFailures >= 4
            ? DataProviderStatus.unavailable
            : DataProviderStatus.degraded,
        totalRequests: totalRequests + 1,
        successfulRequests: successfulRequests,
        avgLatencyMs: avgLatencyMs,
        measuredAt: measuredAt,
        lastErrorMessage: errorMessage,
        consecutiveFailures: consecutiveFailures + 1,
      );

  @override
  List<Object?> get props => [
    providerName,
    status,
    totalRequests,
    successfulRequests,
    avgLatencyMs,
    measuredAt,
    lastErrorMessage,
    consecutiveFailures,
  ];
}
