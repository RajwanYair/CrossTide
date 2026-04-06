/// Tests for S46 delta fetch — repository merges new candles with cached ones.
library;

import 'package:cross_tide/src/data/database/database.dart';
import 'package:cross_tide/src/data/providers/market_data_provider.dart';
import 'package:cross_tide/src/data/repository.dart';
import 'package:cross_tide/src/domain/entities.dart' as domain;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logger/logger.dart';

// A provider that records calls and returns configurable data.
class _TrackingProvider implements IMarketDataProvider {
  int fullFetchCount = 0;
  List<domain.DailyCandle> fullData = [];

  @override
  String get id => 'tracking';
  @override
  String get name => 'Tracking';

  @override
  Future<List<domain.DailyCandle>> fetchDailyHistory(String ticker) async {
    fullFetchCount++;
    return fullData;
  }
}

domain.DailyCandle _candle(DateTime date, {double close = 100.0}) => domain.DailyCandle(
  date: date,
  open: close,
  high: close + 1,
  low: close - 1,
  close: close,
  volume: 1000,
);

void main() {
  late AppDatabase db;
  late StockRepository repo;
  late _TrackingProvider provider;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    // Register teardown here so db.close() runs even if a test throws.
    addTearDown(() => db.close());
    provider = _TrackingProvider();
    repo = StockRepository(
      db: db,
      provider: provider,
      logger: Logger(level: Level.off),
    );
  });

  group('fetchAndCacheCandles — non-Yahoo provider', () {
    test('fetches full history on cache miss', () async {
      final now = DateTime(2024, 6, 10);
      provider.fullData = [_candle(now, close: 150)];

      final result = await repo.fetchAndCacheCandles('AAPL');
      expect(result.length, 1);
      expect(result.first.close, 150.0);
      expect(provider.fullFetchCount, 1);
    });

    test('returns cached data within TTL', () async {
      final now = DateTime(2024, 6, 10);
      provider.fullData = [_candle(now)];

      // First fetch — populates cache + sets lastRefreshAt
      await repo.fetchAndCacheCandles('AAPL');
      expect(provider.fullFetchCount, 1);

      // Second fetch within TTL — cache hit, no provider call
      await repo.fetchAndCacheCandles('AAPL', cacheTtlMinutes: 60);
      expect(provider.fullFetchCount, 1); // unchanged
    });
  });
}
