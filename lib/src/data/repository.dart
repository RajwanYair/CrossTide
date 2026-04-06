/// Repository — Bridges domain entities with database and provider layers.
///
/// Handles caching (TTL-based), serialization between domain objects and
/// Drift companions, and orchestrates data access.
library;

import 'package:drift/drift.dart';
import 'package:logger/logger.dart';

import '../domain/domain.dart' as domain;
import 'database/database.dart';
import 'providers/market_data_provider.dart';

/// Converts a comma-separated string to a [Set] of [domain.AlertType].
Set<domain.AlertType> _parseAlertTypes(String raw) {
  if (raw.isEmpty) return const {domain.AlertType.sma200CrossUp};
  return raw.split(',').map((s) {
    return domain.AlertType.values.firstWhere(
      (t) => t.name == s.trim(),
      orElse: () => domain.AlertType.sma200CrossUp,
    );
  }).toSet();
}

/// Converts a [Set] of [domain.AlertType] to a comma-separated string.
String _serializeAlertTypes(Set<domain.AlertType> types) =>
    types.map((t) => t.name).join(',');

class StockRepository {
  StockRepository({required this.db, required this.provider, Logger? logger})
    : _logger = logger ?? Logger();

  final AppDatabase db;
  final IMarketDataProvider provider;
  final Logger _logger;

  // ---- Tickers ----

  Future<List<domain.TickerEntry>> getAllTickers() async {
    final rows = await db.getAllTickers();
    final entries = <domain.TickerEntry>[];
    for (final r in rows) {
      final alertState = await _loadAlertState(r.symbol);
      entries.add(
        domain.TickerEntry(
          symbol: r.symbol,
          addedAt: r.addedAt,
          lastRefreshAt: r.lastRefreshAt,
          lastClose: r.lastClose,
          sma200: r.sma200,
          alertState: alertState,
          error: r.error,
          enabledAlertTypes: _parseAlertTypes(r.enabledAlertTypes),
          sortOrder: r.sortOrder,
          groupId: r.groupId,
        ),
      );
    }
    return entries;
  }

  Stream<List<Ticker>> watchTickers() => db.watchAllTickers();

  Future<void> addTicker(String symbol) async {
    final upper = symbol.toUpperCase().trim();
    await db.upsertTicker(TickersCompanion.insert(symbol: upper));
    await db.upsertAlertState(AlertStatesCompanion.insert(ticker: upper));
  }

  Future<void> removeTicker(String symbol) async {
    final upper = symbol.toUpperCase().trim();
    await db.removeTicker(upper);
    await db.deleteCandlesForTicker(upper);
    // Alert state is deleted via cascade (or manually):
    await (db.delete(
      db.alertStates,
    )..where((a) => a.ticker.equals(upper))).go();
  }

  /// Persist the enabled [alertTypes] for [symbol].
  Future<void> updateTickerAlertTypes(
    String symbol,
    Set<domain.AlertType> alertTypes,
  ) async {
    final upper = symbol.toUpperCase().trim();
    await (db.update(db.tickers)..where((t) => t.symbol.equals(upper)))
        .write(TickersCompanion(enabledAlertTypes: Value(_serializeAlertTypes(alertTypes))));
  }

  /// Persist the [sortOrder] for [symbol].
  Future<void> updateTickerSortOrder(String symbol, int sortOrder) async {
    final upper = symbol.toUpperCase().trim();
    await (db.update(db.tickers)..where((t) => t.symbol.equals(upper)))
        .write(TickersCompanion(sortOrder: Value(sortOrder)));
  }

  /// Assign [symbol] to a watchlist group (null = ungrouped).
  Future<void> updateTickerGroup(String symbol, String? groupId) async {
    final upper = symbol.toUpperCase().trim();
    await (db.update(db.tickers)..where((t) => t.symbol.equals(upper)))
        .write(TickersCompanion(groupId: Value(groupId)));
  }

  // ---- Watchlist Groups ----

  Future<List<WatchlistGroup>> getAllGroups() => db.getAllGroups();

  Stream<List<WatchlistGroup>> watchGroups() => db.watchAllGroups();

  Future<void> upsertGroup(WatchlistGroup group) => db.upsertGroup(
    WatchlistGroupsCompanion(
      id: Value(group.id),
      name: Value(group.name),
      colorValue: Value(group.colorValue),
      sortOrder: Value(group.sortOrder),
    ),
  );

  Future<void> deleteGroup(String id) async {
    // Un-assign tickers belonging to this group
    await (db.update(db.tickers)..where((t) => t.groupId.equals(id)))
        .write(const TickersCompanion(groupId: Value(null)));
    await db.deleteGroup(id);
  }

  // ---- Price Data ----

  /// Fetch and cache daily candles for [symbol].
  /// Respects cache TTL: skips fetch if data was refreshed within [cacheTtlMinutes].
  Future<List<domain.DailyCandle>> fetchAndCacheCandles(
    String symbol, {
    int cacheTtlMinutes = 30,
  }) async {
    final upper = symbol.toUpperCase().trim();

    // Check cache freshness
    final tickers = await db.getAllTickers();
    final existing = tickers.where((t) => t.symbol == upper).firstOrNull;
    if (existing?.lastRefreshAt != null) {
      final age = DateTime.now().difference(existing!.lastRefreshAt!);
      if (age.inMinutes < cacheTtlMinutes) {
        _logger.d('Cache hit for $upper (age: ${age.inMinutes}m)');
        return _loadCachedCandles(upper);
      }
    }

    // Fetch fresh data
    _logger.i('Fetching fresh data for $upper');
    final stopwatch = Stopwatch()..start();
    try {
      final candles = await provider.fetchDailyHistory(upper);
      stopwatch.stop();
      _logger.i(
        'Fetched ${candles.length} candles for $upper in ${stopwatch.elapsedMilliseconds}ms',
      );

      // Persist
      await db.deleteCandlesForTicker(upper);
      final companions = candles
          .map(
            (c) => DailyCandlesCompanion.insert(
              ticker: upper,
              date: c.date,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume,
            ),
          )
          .toList();
      await db.insertCandles(companions);

      // Update ticker metadata
      final lastCandle = candles.isNotEmpty ? candles.last : null;
      await db.upsertTicker(
        TickersCompanion(
          symbol: Value(upper),
          lastRefreshAt: Value(DateTime.now()),
          lastClose: Value(lastCandle?.close),
          error: const Value(null),
        ),
      );

      return candles;
    } catch (e) {
      stopwatch.stop();
      _logger.e('Error fetching $upper: $e');
      await db.upsertTicker(
        TickersCompanion(symbol: Value(upper), error: Value(e.toString())),
      );
      // Fall back to cached data
      return _loadCachedCandles(upper);
    }
  }

  Future<List<domain.DailyCandle>> _loadCachedCandles(String symbol) async {
    final rows = await db.getCandlesForTicker(symbol);
    return rows
        .map(
          (r) => domain.DailyCandle(
            date: r.date,
            open: r.open,
            high: r.high,
            low: r.low,
            close: r.close,
            volume: r.volume,
          ),
        )
        .toList();
  }

  // ---- Alert State ----

  Future<domain.TickerAlertState> getAlertState(String symbol) async {
    return await _loadAlertState(symbol.toUpperCase().trim());
  }

  Future<void> saveAlertState(domain.TickerAlertState state) async {
    await db.upsertAlertState(
      AlertStatesCompanion(
        ticker: Value(state.ticker),
        lastStatus: Value(state.lastStatus.name),
        lastAlertedCrossUpAt: Value(state.lastAlertedCrossUpAt),
        lastEvaluatedAt: Value(state.lastEvaluatedAt),
        lastCloseUsed: Value(state.lastCloseUsed),
        lastSma200: Value(state.lastSma200),
      ),
    );
  }

  Future<domain.TickerAlertState> _loadAlertState(String symbol) async {
    final row = await db.getAlertState(symbol);
    if (row == null) {
      return domain.TickerAlertState(
        ticker: symbol,
        lastStatus: domain.SmaRelation.unknown,
      );
    }
    return domain.TickerAlertState(
      ticker: row.ticker,
      lastStatus: domain.SmaRelation.values.firstWhere(
        (e) => e.name == row.lastStatus,
        orElse: () => domain.SmaRelation.unknown,
      ),
      lastAlertedCrossUpAt: row.lastAlertedCrossUpAt,
      lastEvaluatedAt: row.lastEvaluatedAt,
      lastCloseUsed: row.lastCloseUsed,
      lastSma200: row.lastSma200,
    );
  }

  // ---- Settings ----

  Future<domain.AppSettings> getSettings() async {
    final row = await db.getSettings();
    if (row == null) return const domain.AppSettings();
    return domain.AppSettings(
      refreshIntervalMinutes: row.refreshIntervalMinutes,
      quietHoursStart: row.quietHoursStart,
      quietHoursEnd: row.quietHoursEnd,
      trendStrictnessDays: row.trendStrictnessDays,
      providerName: row.providerName,
      cacheTtlMinutes: row.cacheTtlMinutes,
    );
  }

  Future<void> saveSettings(domain.AppSettings settings) async {
    await db.upsertSettings(
      AppSettingsTableCompanion(
        id: const Value(1),
        refreshIntervalMinutes: Value(settings.refreshIntervalMinutes),
        quietHoursStart: Value(settings.quietHoursStart),
        quietHoursEnd: Value(settings.quietHoursEnd),
        trendStrictnessDays: Value(settings.trendStrictnessDays),
        providerName: Value(settings.providerName),
        cacheTtlMinutes: Value(settings.cacheTtlMinutes),
      ),
    );
  }

  /// Update SMA200 on the ticker row for quick display.
  Future<void> updateTickerSma(String symbol, double? sma200) async {
    await db.upsertTicker(
      TickersCompanion(
        symbol: Value(symbol.toUpperCase().trim()),
        sma200: Value(sma200),
      ),
    );
  }
}
