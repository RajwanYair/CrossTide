/// Tests for S51 SnapshotService — verifies serialisation logic.
///
/// Because path_provider requires a platform channel, we test the
/// JSON-building logic in isolation without writing to disk.
library;

import 'dart:convert';
import 'dart:io';

import 'package:cross_tide/src/application/snapshot_service.dart';
import 'package:cross_tide/src/data/database/database.dart';
import 'package:cross_tide/src/data/providers/market_data_provider.dart';
import 'package:cross_tide/src/data/repository.dart';
import 'package:cross_tide/src/domain/entities.dart' as domain;
import 'package:cross_tide/src/domain/entities.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:path/path.dart' as p;

// Expose the private helpers by testing the JSON shape directly through
// a minimal stub that mimics what exportJson() produces.
Map<String, dynamic> _buildSnapshotPayload({
  required AppSettings settings,
  required List<TickerEntry> tickers,
  Map<String, TickerAlertState> alertStates = const {},
}) {
  Map<String, dynamic> settingsToMap(AppSettings s) => {
    'refreshIntervalMinutes': s.refreshIntervalMinutes,
    'quietHoursStart': s.quietHoursStart,
    'quietHoursEnd': s.quietHoursEnd,
    'trendStrictnessDays': s.trendStrictnessDays,
    'providerName': s.providerName,
    'cacheTtlMinutes': s.cacheTtlMinutes,
    'advancedMode': s.advancedMode,
    'defaultIndicators': s.defaultIndicators,
    'volumeSpikeMultiplier': s.volumeSpikeMultiplier,
    'accentColorValue': s.accentColorValue,
  };

  Map<String, dynamic> tickerToMap(TickerEntry t) => {
    'symbol': t.symbol,
    'addedAt': t.addedAt?.toIso8601String(),
    'lastRefreshAt': t.lastRefreshAt?.toIso8601String(),
    'lastClose': t.lastClose,
    'sma200': t.sma200,
    'error': t.error,
    'enabledAlertTypes': t.enabledAlertTypes.map((a) => a.name).toList(),
    'sortOrder': t.sortOrder,
    'groupId': t.groupId,
    'nextEarningsAt': t.nextEarningsAt?.toIso8601String(),
  };

  Map<String, dynamic> stateToMap(TickerAlertState s) => {
    'ticker': s.ticker,
    'lastStatus': s.lastStatus.name,
    'lastAlertedCrossUpAt': s.lastAlertedCrossUpAt?.toIso8601String(),
    'lastEvaluatedAt': s.lastEvaluatedAt?.toIso8601String(),
    'lastCloseUsed': s.lastCloseUsed,
    'lastSma200': s.lastSma200,
  };

  return {
    'exportedAt': DateTime(2025, 6, 1).toIso8601String(),
    'appVersion': '1.1.0',
    'settings': settingsToMap(settings),
    'tickers': tickers.map(tickerToMap).toList(),
    'alertStates': alertStates.map((k, v) => MapEntry(k, stateToMap(v))),
  };
}

void main() {
  group('SnapshotService JSON shape', () {
    test('empty watchlist snapshot is valid JSON with required keys', () {
      final payload = _buildSnapshotPayload(
        settings: const AppSettings(),
        tickers: [],
      );

      final json = const JsonEncoder.withIndent('  ').convert(payload);
      final decoded = jsonDecode(json) as Map<String, dynamic>;

      expect(
        decoded.keys,
        containsAll(['exportedAt', 'settings', 'tickers', 'alertStates']),
      );
      expect(decoded['tickers'], isEmpty);
      expect(decoded['alertStates'], isEmpty);
    });

    test('settings fields all serialised', () {
      const s = AppSettings(
        refreshIntervalMinutes: 45,
        trendStrictnessDays: 2,
        advancedMode: true,
        volumeSpikeMultiplier: 3.0,
      );
      final payload = _buildSnapshotPayload(settings: s, tickers: []);
      final settings = payload['settings'] as Map<String, dynamic>;

      expect(settings['refreshIntervalMinutes'], 45);
      expect(settings['trendStrictnessDays'], 2);
      expect(settings['advancedMode'], isTrue);
      expect(settings['volumeSpikeMultiplier'], 3.0);
    });

    test('ticker entry serialised with all expected keys', () {
      const ticker = TickerEntry(
        symbol: 'AAPL',
        sortOrder: 0,
        enabledAlertTypes: {AlertType.sma200CrossUp},
      );
      final payload = _buildSnapshotPayload(
        settings: const AppSettings(),
        tickers: [ticker],
      );
      final tickers = payload['tickers'] as List<dynamic>;
      final t = tickers.first as Map<String, dynamic>;

      expect(t['symbol'], 'AAPL');
      expect(t['enabledAlertTypes'], contains('sma200CrossUp'));
    });

    test('alert state serialised correctly', () {
      const state = TickerAlertState(
        ticker: 'AAPL',
        lastStatus: SmaRelation.below,
      );
      final payload = _buildSnapshotPayload(
        settings: const AppSettings(),
        tickers: [],
        alertStates: {'AAPL': state},
      );
      final states = payload['alertStates'] as Map<String, dynamic>;

      expect(states.containsKey('AAPL'), isTrue);
      final s = states['AAPL'] as Map<String, dynamic>;
      expect(s['lastStatus'], 'below');
    });

    test('snapshot is round-trip stable JSON', () {
      final payload = _buildSnapshotPayload(
        settings: const AppSettings(),
        tickers: [],
      );

      final json1 = jsonEncode(payload);
      final json2 = jsonEncode(jsonDecode(json1));
      expect(json1, json2);
    });
  });

  // ---------------------------------------------------------------------------
  // Rollback — _settingsFromMap is exercised via SnapshotService.rollbackSettings
  // ---------------------------------------------------------------------------

  group('SnapshotService.rollbackSettings', () {
    late AppDatabase testDb;
    late StockRepository repo;
    late Directory tempDir;

    setUp(() async {
      testDb = AppDatabase.forTesting(NativeDatabase.memory());
      repo = StockRepository(db: testDb, provider: _NoOpProvider());
      tempDir = await Directory.systemTemp.createTemp('ct_rollback_test_');
    });

    tearDown(() async {
      await testDb.close();
      if (tempDir.existsSync()) await tempDir.delete(recursive: true);
    });

    Future<String> writeSnapshot(Map<String, dynamic> payload) async {
      final file = File(p.join(tempDir.path, 'snap.json'));
      await file.writeAsString(jsonEncode(payload));
      return file.path;
    }

    test('restores settings field values from snapshot', () async {
      const original = AppSettings(
        refreshIntervalMinutes: 30,
        trendStrictnessDays: 3,
        advancedMode: true,
        cacheTtlMinutes: 15,
        volumeSpikeMultiplier: 4.0,
        accentColorValue: 0xFFFF0000,
        providerName: 'alpha_vantage',
      );

      final payload = _buildSnapshotPayload(settings: original, tickers: []);
      final path = await writeSnapshot(payload);

      final svc = SnapshotService(repository: repo);
      final restored = await svc.rollbackSettings(path);

      expect(restored.refreshIntervalMinutes, 30);
      expect(restored.trendStrictnessDays, 3);
      expect(restored.advancedMode, isTrue);
      expect(restored.cacheTtlMinutes, 15);
      expect(restored.volumeSpikeMultiplier, 4.0);
      expect(restored.accentColorValue, 0xFFFF0000);
      expect(restored.providerName, 'alpha_vantage');
    });

    test('persisted settings match returned value', () async {
      const settings = AppSettings(refreshIntervalMinutes: 45);
      final payload = _buildSnapshotPayload(settings: settings, tickers: []);
      final path = await writeSnapshot(payload);

      final svc = SnapshotService(repository: repo);
      await svc.rollbackSettings(path);

      final persisted = await repo.getSettings();
      expect(persisted.refreshIntervalMinutes, 45);
    });

    test('throws FormatException for non-object JSON', () async {
      final file = File(p.join(tempDir.path, 'bad.json'));
      await file.writeAsString('["not", "an", "object"]');

      final svc = SnapshotService(repository: repo);
      await expectLater(
        svc.rollbackSettings(file.path),
        throwsA(isA<FormatException>()),
      );
    });

    test('throws FormatException when settings key is missing', () async {
      final path = await writeSnapshot({
        'exportedAt': '2025-01-01',
        'tickers': <dynamic>[],
      });

      final svc = SnapshotService(repository: repo);
      await expectLater(
        svc.rollbackSettings(path),
        throwsA(isA<FormatException>()),
      );
    });

    test('uses defaults for missing numeric fields', () async {
      final path = await writeSnapshot({
        'settings': <String, dynamic>{},
        'tickers': <dynamic>[],
      });

      final svc = SnapshotService(repository: repo);
      final restored = await svc.rollbackSettings(path);

      expect(restored.refreshIntervalMinutes, 60);
      expect(restored.trendStrictnessDays, 1);
      expect(restored.advancedMode, isFalse);
    });
  });
}

// Minimal no-op market data provider for repository construction.
class _NoOpProvider implements IMarketDataProvider {
  @override
  String get id => 'noop';
  @override
  String get name => 'NoOp';
  @override
  Future<List<domain.DailyCandle>> fetchDailyHistory(String ticker) async => [];
}
