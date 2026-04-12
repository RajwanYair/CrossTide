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
import 'providers/yahoo_finance_provider.dart';

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
          sma150: r.sma150,
          alertState: alertState,
          error: r.error,
          enabledAlertTypes: _parseAlertTypes(r.enabledAlertTypes),
          sortOrder: r.sortOrder,
          groupId: r.groupId,
          nextEarningsAt: r.nextEarningsAt,
          companyName: r.companyName,
          description: r.description,
          industry: r.industry,
          indexMembership: r.indexMembership,
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
    await (db.update(db.tickers)..where((t) => t.symbol.equals(upper))).write(
      TickersCompanion(
        enabledAlertTypes: Value(_serializeAlertTypes(alertTypes)),
      ),
    );
  }

  /// Persist the [sortOrder] for [symbol].
  Future<void> updateTickerSortOrder(String symbol, int sortOrder) async {
    final upper = symbol.toUpperCase().trim();
    await (db.update(db.tickers)..where((t) => t.symbol.equals(upper))).write(
      TickersCompanion(sortOrder: Value(sortOrder)),
    );
  }

  /// Assign [symbol] to a watchlist group (null = ungrouped).
  Future<void> updateTickerGroup(String symbol, String? groupId) async {
    final upper = symbol.toUpperCase().trim();
    await (db.update(db.tickers)..where((t) => t.symbol.equals(upper))).write(
      TickersCompanion(groupId: Value(groupId)),
    );
  }

  Future<void> reorderTickers(List<String> orderedSymbols) async {
    for (int i = 0; i < orderedSymbols.length; i++) {
      await (db.update(db.tickers)
            ..where((t) => t.symbol.equals(orderedSymbols[i])))
          .write(TickersCompanion(sortOrder: Value(i)));
    }
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
    await (db.update(db.tickers)..where((t) => t.groupId.equals(id))).write(
      const TickersCompanion(groupId: Value(null)),
    );
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
      // --- Delta fetch ---------------------------------------------------
      // If we already have cached candles and the provider supports it,
      // only fetch candles since the last cached date (much faster).
      List<domain.DailyCandle> candles;
      final cachedRows = await db.getCandlesForTicker(upper);
      final lastCachedDate = cachedRows.isNotEmpty
          ? cachedRows.last.date
          : null;

      if (lastCachedDate != null && provider is YahooFinanceProvider) {
        final yahoo = provider as YahooFinanceProvider;
        _logger.i('Delta fetch for $upper since $lastCachedDate');
        final existingCandles = cachedRows
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
        final newCandles = await yahoo.fetchDailyHistoryDelta(
          upper,
          lastCachedDate,
        );
        if (newCandles.isNotEmpty) {
          // Merge: keep existing, upsert new (duplicate dates replaced)
          final dateSet = {
            for (final c in newCandles)
              DateTime(c.date.year, c.date.month, c.date.day),
          };
          final merged = [
            ...existingCandles.where(
              (c) => !dateSet.contains(
                DateTime(c.date.year, c.date.month, c.date.day),
              ),
            ),
            ...newCandles,
          ]..sort((a, b) => a.date.compareTo(b.date));
          candles = merged;
          // Persist merged set
          await db.deleteCandlesForTicker(upper);
          await db.insertCandles(
            candles
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
                .toList(),
          );
        } else {
          // No new candles — use existing cache as-is
          candles = existingCandles.isNotEmpty
              ? existingCandles
              : await _loadCachedCandles(upper);
        }
      } else {
        candles = await provider.fetchDailyHistory(upper);
        // Persist full history
        await db.deleteCandlesForTicker(upper);
        await db.insertCandles(
          candles
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
              .toList(),
        );
      }

      stopwatch.stop();
      _logger.i(
        'Fetched ${candles.length} candles for $upper in ${stopwatch.elapsedMilliseconds}ms',
      );

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
        lastMichoBuyAt: Value(state.lastMichoBuyAt),
        lastMichoSellAt: Value(state.lastMichoSellAt),
        lastConsensusBuyAt: Value(state.lastConsensusBuyAt),
        lastConsensusSellAt: Value(state.lastConsensusSellAt),
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
      lastMichoBuyAt: row.lastMichoBuyAt,
      lastMichoSellAt: row.lastMichoSellAt,
      lastConsensusBuyAt: row.lastConsensusBuyAt,
      lastConsensusSellAt: row.lastConsensusSellAt,
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
      advancedMode: row.advancedMode != 0,
      defaultIndicators: row.defaultIndicators.isEmpty
          ? const []
          : row.defaultIndicators.split(','),
      volumeSpikeMultiplier: row.volumeSpikeMultiplier,
      accentColorValue: row.accentColorValue,
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
        advancedMode: Value(settings.advancedMode ? 1 : 0),
        defaultIndicators: Value(settings.defaultIndicators.join(',')),
        volumeSpikeMultiplier: Value(settings.volumeSpikeMultiplier),
        accentColorValue: Value(settings.accentColorValue),
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

  /// Update SMA150 on the ticker row for Micho Method status display.
  Future<void> updateTickerSma150(String symbol, double? sma150) async {
    await db.upsertTicker(
      TickersCompanion(
        symbol: Value(symbol.toUpperCase().trim()),
        sma150: Value(sma150),
      ),
    );
  }

  /// Persist the next earnings date for [symbol].
  Future<void> updateNextEarnings(String symbol, DateTime? date) =>
      db.updateNextEarnings(symbol.toUpperCase().trim(), date);

  /// Persist company profile data for [symbol].
  Future<void> updateTickerProfile(
    String symbol, {
    required String? companyName,
    required String? description,
    required String? industry,
    required String? indexMembership,
  }) => db.updateTickerProfile(
    symbol.toUpperCase().trim(),
    companyName: companyName,
    description: description,
    industry: industry,
    indexMembership: indexMembership,
  );

  // ---- Price Targets ----

  Stream<List<domain.PriceTarget>> watchPriceTargets(String symbol) => db
      .watchPriceTargets(symbol.toUpperCase().trim())
      .map((rows) => rows.map(_priceTargetFromRow).toList());

  Future<List<domain.PriceTarget>> getPriceTargets(String symbol) async {
    final rows = await db.getPriceTargets(symbol.toUpperCase().trim());
    return rows.map(_priceTargetFromRow).toList();
  }

  Future<List<domain.PriceTarget>> getAllPendingPriceTargets() async {
    final rows = await db.getAllPendingPriceTargets();
    return rows.map(_priceTargetFromRow).toList();
  }

  Future<void> addPriceTarget(domain.PriceTarget target) async {
    await db.insertPriceTarget(
      PriceTargetsTableCompanion.insert(
        symbol: target.symbol.toUpperCase().trim(),
        targetPrice: target.targetPrice,
        note: Value(target.note),
      ),
    );
  }

  Future<void> markPriceTargetFired(int id) => db.markPriceTargetFired(id);

  Future<void> deletePriceTarget(int id) => db.deletePriceTarget(id);

  domain.PriceTarget _priceTargetFromRow(PriceTargetsTableData row) =>
      domain.PriceTarget(
        id: row.id,
        symbol: row.symbol,
        targetPrice: row.targetPrice,
        note: row.note,
        createdAt: row.createdAt,
        firedAt: row.firedAt,
      );

  // ---- Pct-Move Thresholds ----

  Stream<List<domain.PctMoveThreshold>> watchPctMoveThresholds(String symbol) =>
      db
          .watchPctMoveThresholds(symbol.toUpperCase().trim())
          .map((rows) => rows.map(_pctMoveFromRow).toList());

  Future<List<domain.PctMoveThreshold>> getPctMoveThresholds(
    String symbol,
  ) async {
    final rows = await db.getPctMoveThresholds(symbol.toUpperCase().trim());
    return rows.map(_pctMoveFromRow).toList();
  }

  Future<List<domain.PctMoveThreshold>> getAllPctMoveThresholds() async {
    final rows = await db.getAllPctMoveThresholds();
    return rows.map(_pctMoveFromRow).toList();
  }

  Future<void> addPctMoveThreshold(domain.PctMoveThreshold t) async {
    await db.insertPctMoveThreshold(
      PctMoveThresholdsTableCompanion.insert(
        symbol: t.symbol.toUpperCase().trim(),
        thresholdPct: t.thresholdPct,
        note: Value(t.note),
      ),
    );
  }

  Future<void> deletePctMoveThreshold(int id) => db.deletePctMoveThreshold(id);

  domain.PctMoveThreshold _pctMoveFromRow(PctMoveThresholdsTableData row) =>
      domain.PctMoveThreshold(
        id: row.id,
        symbol: row.symbol,
        thresholdPct: row.thresholdPct,
        note: row.note,
        createdAt: row.createdAt,
      );

  // ---- Alert History ----

  Future<void> addAlertHistory({
    required String symbol,
    required String alertType,
    required String message,
    DateTime? firedAt,
  }) => db.insertAlertHistory(
    AlertHistoryTableCompanion(
      symbol: Value(symbol),
      alertType: Value(alertType),
      message: Value(message),
      firedAt: firedAt != null ? Value(firedAt) : const Value.absent(),
    ),
  );

  Stream<List<domain.AlertHistoryEntry>> watchAlertHistory() =>
      db.watchAlertHistory().map((rows) => rows.map(_historyFromRow).toList());

  Future<List<domain.AlertHistoryEntry>> getAlertHistory() async {
    final rows = await db.getAlertHistory();
    return rows.map(_historyFromRow).toList();
  }

  /// Computes [AlertSensitivityStats] for [symbol] from stored history.
  Future<domain.AlertSensitivityStats> getAlertSensitivityStats(
    String symbol,
  ) async {
    final upper = symbol.toUpperCase().trim();
    final allRows = await db.getAlertHistory();
    final forSymbol = allRows
        .where((r) => r.symbol == upper)
        .map(_historyFromRow)
        .toList();
    return domain.AlertSensitivityStats.fromHistory(upper, forSymbol);
  }

  Future<void> acknowledgeAlertHistory(int id) =>
      db.acknowledgeAlertHistory(id);

  Future<void> clearAlertHistory() => db.clearAlertHistory();

  domain.AlertHistoryEntry _historyFromRow(AlertHistoryTableData row) =>
      domain.AlertHistoryEntry(
        id: row.id,
        symbol: row.symbol,
        alertType: row.alertType,
        message: row.message,
        firedAt: row.firedAt,
        acknowledged: row.acknowledged,
      );
}
