/// Snapshot Service — serialises the entire app state to a dated JSON file.
///
/// The snapshot captures:
///   - All tickers in the watchlist
///   - Alert states per ticker
///   - Current app settings
///
/// Files are written to `<tempDir>/crosstide_snapshots/` and named
/// `crosstide_snapshot_YYYY-MM-DD.json`.  The same path is returned so the
/// caller can offer a "share" or "open folder" action.
///
/// Use [SnapshotService.exportJson] from the Settings screen or from a
/// scheduled Windows Task Scheduler job.
library;

import 'dart:convert';
import 'dart:io';

import 'package:logger/logger.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../data/repository.dart';
import '../domain/entities.dart';

class SnapshotService {
  SnapshotService({required this.repository, Logger? logger})
    : _logger = logger ?? Logger();

  final StockRepository repository;
  final Logger _logger;

  /// Exports the current app state to a JSON file.
  ///
  /// Returns the absolute path to the written file on success.
  ///
  /// Throws if the repository cannot be read or the file cannot be written.
  Future<String> exportJson() async {
    _logger.d('SnapshotService: building snapshot…');

    final tickers = await repository.getAllTickers();
    final settings = await repository.getSettings();

    final stateMap = <String, Map<String, dynamic>>{};
    for (final ticker in tickers) {
      try {
        final state = await repository.getAlertState(ticker.symbol);
        stateMap[ticker.symbol] = _alertStateToMap(state);
      } catch (_) {
        stateMap[ticker.symbol] = {};
      }
    }

    final snapshot = <String, dynamic>{
      'exportedAt': DateTime.now().toIso8601String(),
      'appVersion': '1.1.0', // keep in sync with pubspec
      'settings': _settingsToMap(settings),
      'tickers': tickers.map(_tickerToMap).toList(),
      'alertStates': stateMap,
    };

    final json = const JsonEncoder.withIndent('  ').convert(snapshot);

    final dir = await _snapshotDir();
    final dateStr = _dateKey(DateTime.now());
    final file = File(p.join(dir.path, 'crosstide_snapshot_$dateStr.json'));
    await file.writeAsString(json, flush: true);

    _logger.i('SnapshotService: wrote ${file.path}');
    return file.path;
  }

  // ---- helpers -------------------------------------------------------------

  Future<Directory> _snapshotDir() async {
    final temp = await getTemporaryDirectory();
    final dir = Directory(p.join(temp.path, 'crosstide_snapshots'));
    if (!dir.existsSync()) await dir.create(recursive: true);
    return dir;
  }

  String _dateKey(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}'
      '-${dt.month.toString().padLeft(2, '0')}'
      '-${dt.day.toString().padLeft(2, '0')}';

  Map<String, dynamic> _settingsToMap(AppSettings s) => {
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

  Map<String, dynamic> _tickerToMap(TickerEntry t) => {
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

  Map<String, dynamic> _alertStateToMap(TickerAlertState s) => {
    'ticker': s.ticker,
    'lastStatus': s.lastStatus.name,
    'lastAlertedCrossUpAt': s.lastAlertedCrossUpAt?.toIso8601String(),
    'lastEvaluatedAt': s.lastEvaluatedAt?.toIso8601String(),
    'lastCloseUsed': s.lastCloseUsed,
    'lastSma200': s.lastSma200,
  };

  // ---- rollback ------------------------------------------------------------

  /// Restores [AppSettings] from a previously exported snapshot JSON file at
  /// [filePath].
  ///
  /// Only settings fields are restored. Ticker list and alert states are left
  /// unchanged so the caller can decide whether to also replay those.
  ///
  /// Returns the restored [AppSettings] after persisting it to the repository.
  ///
  /// Throws [FormatException] if the file cannot be parsed or is missing the
  /// `settings` key.
  Future<AppSettings> rollbackSettings(String filePath) async {
    _logger.d('SnapshotService: rolling back settings from $filePath');
    final file = File(filePath);
    final contents = await file.readAsString();
    final dynamic root = jsonDecode(contents);
    if (root is! Map<String, dynamic>) {
      throw const FormatException('Snapshot root must be a JSON object');
    }
    final rawSettings = root['settings'];
    if (rawSettings is! Map<String, dynamic>) {
      throw const FormatException('Snapshot missing "settings" key');
    }
    final settings = _settingsFromMap(rawSettings);
    await repository.saveSettings(settings);
    _logger.i('SnapshotService: settings rolled back from $filePath');
    return settings;
  }

  AppSettings _settingsFromMap(Map<String, dynamic> m) {
    List<String> parseIndicators(dynamic raw) {
      if (raw is List) return raw.whereType<String>().toList();
      return const [];
    }

    return AppSettings(
      refreshIntervalMinutes:
          (m['refreshIntervalMinutes'] as num?)?.toInt() ?? 60,
      quietHoursStart: (m['quietHoursStart'] as num?)?.toInt(),
      quietHoursEnd: (m['quietHoursEnd'] as num?)?.toInt(),
      trendStrictnessDays: (m['trendStrictnessDays'] as num?)?.toInt() ?? 1,
      providerName: (m['providerName'] as String?) ?? 'yahoo_finance',
      cacheTtlMinutes: (m['cacheTtlMinutes'] as num?)?.toInt() ?? 30,
      advancedMode: (m['advancedMode'] as bool?) ?? false,
      defaultIndicators: parseIndicators(m['defaultIndicators']),
      volumeSpikeMultiplier:
          (m['volumeSpikeMultiplier'] as num?)?.toDouble() ?? 2.0,
      accentColorValue: (m['accentColorValue'] as num?)?.toInt() ?? 0xFF0D47A1,
    );
  }
}
