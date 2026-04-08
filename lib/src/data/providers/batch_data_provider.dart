/// Batch Data Provider — wraps any IMarketDataProvider
/// to fetch multiple tickers concurrently with configurable parallelism.
library;

import 'dart:async';

import '../../domain/entities.dart';
import 'market_data_provider.dart';

/// Result of a batch fetch for a single ticker.
class BatchFetchResult {
  const BatchFetchResult({
    required this.ticker,
    required this.candles,
    required this.error,
    required this.durationMs,
  });

  final String ticker;
  final List<DailyCandle>? candles;
  final String? error;
  final int durationMs;

  bool get isSuccess => candles != null;
}

/// Fetches multiple tickers concurrently with rate limiting.
class BatchDataProvider {
  BatchDataProvider({
    required IMarketDataProvider provider,
    this.maxConcurrency = 3,
  }) : _provider = provider;

  final IMarketDataProvider _provider;
  final int maxConcurrency;

  /// Fetch candles for all [tickers] with bounded parallelism.
  ///
  /// Tickers are processed in batches of [maxConcurrency]. Within each batch
  /// all fetches run concurrently; the next batch starts once the current one
  /// completes. Errors are captured per-ticker, not thrown.
  Future<List<BatchFetchResult>> fetchAll(List<String> tickers) async {
    if (tickers.isEmpty) return [];
    final results = <BatchFetchResult>[];
    for (int i = 0; i < tickers.length; i += maxConcurrency) {
      final int end = (i + maxConcurrency).clamp(0, tickers.length);
      final List<String> chunk = tickers.sublist(i, end);
      final List<BatchFetchResult> chunkResults = await Future.wait(
        chunk.map(_fetchOne),
      );
      results.addAll(chunkResults);
    }
    return results;
  }

  Future<BatchFetchResult> _fetchOne(String ticker) async {
    final sw = Stopwatch()..start();
    try {
      final candles = await _provider.fetchDailyHistory(ticker);
      sw.stop();
      return BatchFetchResult(
        ticker: ticker,
        candles: candles,
        error: null,
        durationMs: sw.elapsedMilliseconds,
      );
    } on MarketDataException catch (e) {
      sw.stop();
      return BatchFetchResult(
        ticker: ticker,
        candles: null,
        error: e.message,
        durationMs: sw.elapsedMilliseconds,
      );
    }
  }
}
