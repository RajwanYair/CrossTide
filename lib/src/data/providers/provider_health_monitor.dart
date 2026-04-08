/// Provider Health Monitor — tracks success/failure metrics for each
/// IMarketDataProvider, enabling smart failover decisions.
library;

/// Health status of a single provider.
class ProviderHealth {
  ProviderHealth({required this.providerId});

  final String providerId;
  int successCount = 0;
  int failureCount = 0;
  DateTime? lastSuccessAt;
  DateTime? lastFailureAt;
  int consecutiveFailures = 0;

  /// Success rate (0–1). Returns 1.0 if no requests yet.
  double get successRate {
    final total = successCount + failureCount;
    return total > 0 ? successCount / total : 1.0;
  }

  /// Whether the provider is considered healthy.
  bool get isHealthy => consecutiveFailures < 3;

  /// Record a successful request.
  void recordSuccess() {
    successCount++;
    consecutiveFailures = 0;
    lastSuccessAt = DateTime.now();
  }

  /// Record a failed request.
  void recordFailure() {
    failureCount++;
    consecutiveFailures++;
    lastFailureAt = DateTime.now();
  }

  /// Reset all counters.
  void reset() {
    successCount = 0;
    failureCount = 0;
    consecutiveFailures = 0;
    lastSuccessAt = null;
    lastFailureAt = null;
  }
}

/// Monitors health of all registered providers.
class ProviderHealthMonitor {
  final _providers = <String, ProviderHealth>{};

  /// Get or create health tracker for a provider.
  ProviderHealth healthFor(String providerId) {
    return _providers.putIfAbsent(
      providerId,
      () => ProviderHealth(providerId: providerId),
    );
  }

  /// Record a success for a provider.
  void recordSuccess(String providerId) {
    healthFor(providerId).recordSuccess();
  }

  /// Record a failure for a provider.
  void recordFailure(String providerId) {
    healthFor(providerId).recordFailure();
  }

  /// Get all provider IDs sorted by health (best first).
  List<String> rankedProviders() {
    final entries = _providers.values.toList()
      ..sort(
        (ProviderHealth a, ProviderHealth b) =>
            b.successRate.compareTo(a.successRate),
      );
    return entries.map((ProviderHealth h) => h.providerId).toList();
  }

  /// Get all tracked providers.
  Map<String, ProviderHealth> get all =>
      Map<String, ProviderHealth>.unmodifiable(_providers);
}
