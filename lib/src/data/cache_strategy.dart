/// Cache Strategy — configurable TTL and stale-while-revalidate logic
/// for the market data repository.
library;

/// Cache freshness strategy.
enum CacheMode {
  /// Always fetch fresh data.
  networkOnly,

  /// Use cache if available and fresh; fetch otherwise.
  cacheFirst,

  /// Return stale cache immediately, refresh in background.
  staleWhileRevalidate,

  /// Use cache only; never fetch.
  cacheOnly,
}

/// Configuration for cache behavior.
class CacheStrategy {
  const CacheStrategy({
    this.mode = CacheMode.cacheFirst,
    this.ttl = const Duration(hours: 4),
    this.staleTtl = const Duration(hours: 24),
  });

  /// The caching mode.
  final CacheMode mode;

  /// How long cached data is considered fresh.
  final Duration ttl;

  /// For staleWhileRevalidate: max age before cache is discarded entirely.
  final Duration staleTtl;

  /// Whether cached data from [cachedAt] is still fresh.
  bool isFresh(DateTime cachedAt) {
    return DateTime.now().difference(cachedAt) < ttl;
  }

  /// Whether cached data is stale but still usable (for staleWhileRevalidate).
  bool isStaleButUsable(DateTime cachedAt) {
    final age = DateTime.now().difference(cachedAt);
    return age >= ttl && age < staleTtl;
  }

  /// Whether cached data is too old to use at all.
  bool isExpired(DateTime cachedAt) {
    return DateTime.now().difference(cachedAt) >= staleTtl;
  }

  /// Predefined strategies.
  static const aggressive = CacheStrategy(
    mode: CacheMode.cacheFirst,
    ttl: Duration(hours: 1),
    staleTtl: Duration(hours: 6),
  );

  static const conservative = CacheStrategy(
    mode: CacheMode.cacheFirst,
    ttl: Duration(hours: 8),
    staleTtl: Duration(days: 2),
  );

  static const realtime = CacheStrategy(mode: CacheMode.networkOnly);

  static const offline = CacheStrategy(mode: CacheMode.cacheOnly);
}
