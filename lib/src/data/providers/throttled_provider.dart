/// Rate-limit aware request throttler.
///
/// Wraps any [IMarketDataProvider] and ensures a minimum delay between
/// consecutive requests to avoid HTTP 429 (Too Many Requests) responses.
///
/// Uses a simple token-bucket approach:
///   - Up to [burstSize] immediate requests allowed before throttling.
///   - After burst is exhausted, each request waits [minIntervalMs] ms.
library;

import 'dart:async';

import '../../domain/entities.dart';
import 'market_data_provider.dart';

class ThrottledMarketDataProvider implements IMarketDataProvider {
  ThrottledMarketDataProvider({
    required this.inner,
    this.minIntervalMs = 500,
    this.burstSize = 3,
    this.maxRetries = 2,
    this.retryBackoffMs = 2000,
  });

  final IMarketDataProvider inner;

  /// Minimum milliseconds between requests after burst is exhausted.
  final int minIntervalMs;

  /// How many requests can fire immediately before throttling kicks in.
  final int burstSize;

  /// How many times to retry on HTTP 429 before failing.
  final int maxRetries;

  /// Initial back-off delay (doubles each retry).
  final int retryBackoffMs;

  DateTime? _lastRequestAt;
  int _burstRemaining = 3;

  @override
  String get name => inner.name;

  @override
  String get id => inner.id;

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    await _throttle();
    return _withRetry(() => inner.fetchDailyHistory(ticker));
  }

  Future<void> _throttle() async {
    final now = DateTime.now();
    if (_burstRemaining > 0) {
      _burstRemaining--;
      _lastRequestAt = now;
      return;
    }
    final last = _lastRequestAt;
    if (last != null) {
      final elapsed = now.difference(last).inMilliseconds;
      if (elapsed < minIntervalMs) {
        await Future<void>.delayed(
          Duration(milliseconds: minIntervalMs - elapsed),
        );
      }
    }
    _lastRequestAt = DateTime.now();
  }

  Future<T> _withRetry<T>(Future<T> Function() fn) async {
    int attempt = 0;
    while (true) {
      try {
        return await fn();
      } on MarketDataException catch (e) {
        if (!e.isRetryable || attempt >= maxRetries) rethrow;
        attempt++;
        final backoff = retryBackoffMs * (1 << (attempt - 1)); // exponential
        await Future<void>.delayed(Duration(milliseconds: backoff));
      }
    }
  }
}
