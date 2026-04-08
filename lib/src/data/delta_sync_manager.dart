/// Delta Sync Manager — tracks last-sync timestamps per ticker
/// to enable incremental (delta) fetches instead of full history reload.
library;

/// Record of when a ticker was last synced.
class SyncRecord {
  SyncRecord({
    required this.ticker,
    required this.lastSyncAt,
    this.lastCandleDate,
    this.candleCount = 0,
  });

  final String ticker;
  DateTime lastSyncAt;

  /// Date of the most recent candle in local store.
  DateTime? lastCandleDate;

  /// Total candle count in local store.
  int candleCount;

  /// Whether this ticker needs a sync (more than [maxAge] since last sync).
  bool needsSync({Duration maxAge = const Duration(hours: 4)}) {
    return DateTime.now().difference(lastSyncAt) > maxAge;
  }

  /// Update the sync record after a successful fetch.
  void markSynced({DateTime? latestCandleDate, int? totalCandles}) {
    lastSyncAt = DateTime.now();
    if (latestCandleDate != null) lastCandleDate = latestCandleDate;
    if (totalCandles != null) candleCount = totalCandles;
  }
}

/// Manages sync state for all tracked tickers.
class DeltaSyncManager {
  final _records = <String, SyncRecord>{};

  /// Get or create the sync record for a ticker.
  SyncRecord recordFor(String ticker) {
    return _records.putIfAbsent(
      ticker,
      () => SyncRecord(
        ticker: ticker,
        lastSyncAt: DateTime.fromMillisecondsSinceEpoch(0),
      ),
    );
  }

  /// Mark a ticker as synced.
  void markSynced(
    String ticker, {
    DateTime? latestCandleDate,
    int? totalCandles,
  }) {
    recordFor(ticker).markSynced(
      latestCandleDate: latestCandleDate,
      totalCandles: totalCandles,
    );
  }

  /// Get all tickers that need syncing.
  List<String> tickersNeedingSync({
    Duration maxAge = const Duration(hours: 4),
  }) {
    return _records.entries
        .where(
          (MapEntry<String, SyncRecord> e) => e.value.needsSync(maxAge: maxAge),
        )
        .map((MapEntry<String, SyncRecord> e) => e.key)
        .toList();
  }

  /// Get all tracked tickers.
  List<String> get trackedTickers => _records.keys.toList();

  /// Remove a ticker from tracking.
  void remove(String ticker) {
    _records.remove(ticker);
  }

  /// Clear all records.
  void clear() {
    _records.clear();
  }
}
