// Drift Database Schema for CrossTide.
//
// Tables:
//   - tickers: user-managed ticker list
//   - daily_candles: cached price history per ticker
//   - alert_states: persisted per-ticker alert evaluation state
//   - app_settings: singleton settings row
//   - watchlist_groups: user-defined named groups for organizing tickers
import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'database.g.dart';

// ---------------------------------------------------------------------------
// Table definitions
// ---------------------------------------------------------------------------

class Tickers extends Table {
  TextColumn get symbol => text().withLength(min: 1, max: 10)();
  DateTimeColumn get addedAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get lastRefreshAt => dateTime().nullable()();
  RealColumn get lastClose => real().nullable()();
  RealColumn get sma200 => real().nullable()();
  TextColumn get error => text().nullable()();

  /// Comma-separated list of [AlertType] names the user has enabled.
  /// Defaults to sma200CrossUp only (legacy behaviour preserved).
  TextColumn get enabledAlertTypes =>
      text().withDefault(const Constant('sma200CrossUp'))();

  /// Display order for drag-to-reorder (lower = higher in list).
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();

  /// Optional group assignment (FK to watchlist_groups.id). Null = ungrouped.
  TextColumn get groupId => text().nullable()();

  @override
  Set<Column> get primaryKey => {symbol};
}

class WatchlistGroups extends Table {
  /// UUID primary key.
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 1, max: 40)();

  /// Color stored as ARGB int (e.g. 0xFF1565C0).
  IntColumn get colorValue =>
      integer().withDefault(const Constant(0xFF1565C0))();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}

class PriceTargetsTable extends Table {
  @override
  String get tableName => 'price_targets';

  IntColumn get id => integer().autoIncrement()();
  TextColumn get symbol => text().withLength(min: 1, max: 10)();
  RealColumn get targetPrice => real()();
  TextColumn get note => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  /// Null = alert pending; non-null = alert fired at this timestamp.
  DateTimeColumn get firedAt => dateTime().nullable()();
}

class DailyCandles extends Table {
  TextColumn get ticker => text().withLength(min: 1, max: 10)();
  DateTimeColumn get date => dateTime()();
  RealColumn get open => real()();
  RealColumn get high => real()();
  RealColumn get low => real()();
  RealColumn get close => real()();
  IntColumn get volume => integer()();

  @override
  Set<Column> get primaryKey => {ticker, date};
}

class AlertStates extends Table {
  TextColumn get ticker => text().withLength(min: 1, max: 10)();
  TextColumn get lastStatus => text().withDefault(const Constant('unknown'))();
  DateTimeColumn get lastAlertedCrossUpAt => dateTime().nullable()();
  DateTimeColumn get lastEvaluatedAt => dateTime().nullable()();
  RealColumn get lastCloseUsed => real().nullable()();
  RealColumn get lastSma200 => real().nullable()();

  @override
  Set<Column> get primaryKey => {ticker};
}

class AppSettingsTable extends Table {
  IntColumn get id => integer().withDefault(const Constant(1))();
  IntColumn get refreshIntervalMinutes =>
      integer().withDefault(const Constant(60))();
  IntColumn get quietHoursStart => integer().nullable()();
  IntColumn get quietHoursEnd => integer().nullable()();
  IntColumn get trendStrictnessDays =>
      integer().withDefault(const Constant(1))();
  TextColumn get providerName =>
      text().withDefault(const Constant('yahoo_finance'))();
  IntColumn get cacheTtlMinutes => integer().withDefault(const Constant(30))();
  // v4: UI complexity mode (0 = novice, 1 = advanced)
  IntColumn get advancedMode => integer().withDefault(const Constant(0))();
  // v5: default indicators (comma-separated, e.g. 'SMA200,EMA:20')
  TextColumn get defaultIndicators =>
      text().withDefault(const Constant('SMA200'))();

  @override
  Set<Column> get primaryKey => {id};
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

@DriftDatabase(
  tables: [
    Tickers,
    DailyCandles,
    AlertStates,
    AppSettingsTable,
    WatchlistGroups,
    PriceTargetsTable,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  /// Named constructor for testing with an in-memory database.
  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 6;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onUpgrade: (migrator, from, to) async {
      if (from < 2) {
        await migrator.addColumn(tickers, tickers.enabledAlertTypes);
        await migrator.addColumn(tickers, tickers.sortOrder);
      }
      if (from < 3) {
        await migrator.createTable(watchlistGroups);
        await migrator.addColumn(tickers, tickers.groupId);
      }
      if (from < 4) {
        await migrator.addColumn(appSettingsTable, appSettingsTable.advancedMode);
      }
      if (from < 5) {
        await migrator.addColumn(
          appSettingsTable,
          appSettingsTable.defaultIndicators,
        );
      }
      if (from < 6) {
        await migrator.createTable(priceTargetsTable);
      }
    },
  );
  // ---- Tickers ----

  Future<List<Ticker>> getAllTickers() =>
      (select(tickers)..orderBy([(t) => OrderingTerm.asc(t.sortOrder)])).get();

  Stream<List<Ticker>> watchAllTickers() =>
      (select(tickers)..orderBy([(t) => OrderingTerm.asc(t.sortOrder)]))
          .watch();

  Future<void> upsertTicker(TickersCompanion entry) =>
      into(tickers).insertOnConflictUpdate(entry);

  Future<int> removeTicker(String symbol) =>
      (delete(tickers)..where((t) => t.symbol.equals(symbol))).go();

  // ---- Daily Candles ----

  Future<List<DailyCandle>> getCandlesForTicker(String symbol) =>
      (select(dailyCandles)
            ..where((c) => c.ticker.equals(symbol))
            ..orderBy([(c) => OrderingTerm.asc(c.date)]))
          .get();

  Future<void> insertCandles(List<DailyCandlesCompanion> rows) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(dailyCandles, rows);
    });
  }

  Future<int> deleteCandlesForTicker(String symbol) =>
      (delete(dailyCandles)..where((c) => c.ticker.equals(symbol))).go();

  // ---- Alert States ----

  Future<AlertState?> getAlertState(String symbol) => (select(
    alertStates,
  )..where((a) => a.ticker.equals(symbol))).getSingleOrNull();

  Future<void> upsertAlertState(AlertStatesCompanion entry) =>
      into(alertStates).insertOnConflictUpdate(entry);

  // ---- App Settings ----

  Future<AppSettingsTableData?> getSettings() => (select(
    appSettingsTable,
  )..where((s) => s.id.equals(1))).getSingleOrNull();

  Future<void> upsertSettings(AppSettingsTableCompanion entry) =>
      into(appSettingsTable).insertOnConflictUpdate(entry);

  // ---- Watchlist Groups ----

  Future<List<WatchlistGroup>> getAllGroups() =>
      (select(watchlistGroups)
            ..orderBy([(g) => OrderingTerm.asc(g.sortOrder)]))
          .get();

  Stream<List<WatchlistGroup>> watchAllGroups() =>
      (select(watchlistGroups)
            ..orderBy([(g) => OrderingTerm.asc(g.sortOrder)]))
          .watch();

  Future<void> upsertGroup(WatchlistGroupsCompanion entry) =>
      into(watchlistGroups).insertOnConflictUpdate(entry);

  Future<int> deleteGroup(String id) =>
      (delete(watchlistGroups)..where((g) => g.id.equals(id))).go();

  // ---- Price Targets ----

  Future<List<PriceTargetsTableData>> getPriceTargets(String symbol) =>
      (select(priceTargetsTable)
            ..where((t) => t.symbol.equals(symbol))
            ..orderBy([(t) => OrderingTerm.asc(t.targetPrice)]))
          .get();

  Stream<List<PriceTargetsTableData>> watchPriceTargets(String symbol) =>
      (select(priceTargetsTable)
            ..where((t) => t.symbol.equals(symbol))
            ..orderBy([(t) => OrderingTerm.asc(t.targetPrice)]))
          .watch();

  Future<List<PriceTargetsTableData>> getAllPendingPriceTargets() =>
      (select(priceTargetsTable)
            ..where((t) => t.firedAt.isNull()))
          .get();

  Future<int> upsertPriceTarget(PriceTargetsTableCompanion entry) =>
      into(priceTargetsTable).insertOnConflictUpdate(entry);

  Future<int> insertPriceTarget(PriceTargetsTableCompanion entry) =>
      into(priceTargetsTable).insert(entry);

  Future<void> markPriceTargetFired(int id) =>
      (update(priceTargetsTable)..where((t) => t.id.equals(id))).write(
        PriceTargetsTableCompanion(firedAt: Value(DateTime.now())),
      );

  Future<int> deletePriceTarget(int id) =>
      (delete(priceTargetsTable)..where((t) => t.id.equals(id))).go();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'cross_tide.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
