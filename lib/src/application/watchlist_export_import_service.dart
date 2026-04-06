/// Watchlist Export/Import Service — serialises and deserialises the ticker
/// watchlist to/from JSON for backup and cross-device transfer.
///
/// **Export**: writes `crosstide_watchlist_YYYYMMDD_HHmmss.json` to the
/// application documents directory and returns the path.
///
/// **Import**: validates a JSON file (or string) and bulk-inserts tickers
/// (skipping duplicates that already exist in the DB).  Returns a summary.
library;

import 'dart:convert';
import 'dart:io';

import 'package:intl/intl.dart';
import 'package:logger/logger.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../data/database/database.dart' show WatchlistGroup;
import '../data/repository.dart';
import '../domain/entities.dart';

/// Summary returned after an import operation.
class WatchlistImportResult {
  const WatchlistImportResult({
    required this.inserted,
    required this.skipped,
    required this.errors,
  });

  /// Symbols successfully added.
  final List<String> inserted;

  /// Symbols skipped because they already exist.
  final List<String> skipped;

  /// Symbols that failed validation or insertion.
  final List<String> errors;

  int get total => inserted.length + skipped.length + errors.length;
}

class WatchlistExportImportService {
  WatchlistExportImportService({required this.repository, Logger? logger})
    : _logger = logger ?? Logger();

  final StockRepository repository;
  final Logger _logger;

  static final _fileTs = DateFormat('yyyyMMdd_HHmmss');

  // ---- Export --------------------------------------------------------------

  /// Exports the current watchlist to a JSON file in the app documents folder.
  ///
  /// Returns the absolute path of the created file.
  Future<String> export() async {
    final tickers = await repository.getAllTickers();
    final groups = await repository.getAllGroups();

    final payload = {
      'exportedAt': DateTime.now().toIso8601String(),
      'version': 1,
      'groups': groups.map(_groupToMap).toList(),
      'tickers': tickers.map(_tickerToMap).toList(),
    };

    final json = const JsonEncoder.withIndent('  ').convert(payload);
    final dir = await getApplicationDocumentsDirectory();
    final ts = _fileTs.format(DateTime.now());
    final file = File(p.join(dir.path, 'crosstide_watchlist_$ts.json'));
    await file.writeAsString(json, encoding: utf8, flush: true);

    _logger.i('WatchlistExport: wrote ${file.path}');
    return file.path;
  }

  // ---- Import --------------------------------------------------------------

  /// Imports tickers from [jsonContent] (UTF-8 JSON string).
  ///
  /// Validates structure, skips any symbol already in the local DB, and
  /// bulk-inserts the rest.  Returns a [WatchlistImportResult] summary.
  Future<WatchlistImportResult> importFromJson(String jsonContent) async {
    late Map<String, dynamic> payload;
    try {
      payload = jsonDecode(jsonContent) as Map<String, dynamic>;
    } catch (_) {
      throw const FormatException('Not valid JSON');
    }

    if (!payload.containsKey('tickers')) {
      throw const FormatException(
        'Missing "tickers" key — not a CrossTide watchlist export',
      );
    }

    final rawTickers = payload['tickers'] as List<dynamic>;
    final existing = await repository.getAllTickers();
    final existingSymbols = {for (final t in existing) t.symbol};

    final inserted = <String>[];
    final skipped = <String>[];
    final errors = <String>[];

    for (final raw in rawTickers) {
      final map = raw as Map<String, dynamic>;
      final symbol = (map['symbol'] as String?)?.trim().toUpperCase() ?? '';

      if (symbol.isEmpty) {
        errors.add('<empty>');
        continue;
      }

      if (existingSymbols.contains(symbol)) {
        skipped.add(symbol);
        continue;
      }

      try {
        final ticker = _tickerFromMap(map);
        await repository.addTicker(symbol);
        if (ticker.sortOrder != 0) {
          await repository.updateTickerSortOrder(symbol, ticker.sortOrder);
        }
        if (ticker.groupId != null) {
          await repository.updateTickerGroup(symbol, ticker.groupId);
        }
        await repository.updateTickerAlertTypes(
          symbol,
          ticker.enabledAlertTypes,
        );
        inserted.add(symbol);
        existingSymbols.add(symbol);
        _logger.d('WatchlistImport: added $symbol');
      } catch (e) {
        _logger.w('WatchlistImport: failed to add $symbol: $e');
        errors.add(symbol);
      }
    }

    return WatchlistImportResult(
      inserted: inserted,
      skipped: skipped,
      errors: errors,
    );
  }

  // ---- helpers -------------------------------------------------------------

  Map<String, dynamic> _groupToMap(WatchlistGroup g) => {
    'id': g.id,
    'name': g.name,
    'sortOrder': g.sortOrder,
    'colorValue': g.colorValue,
  };

  Map<String, dynamic> _tickerToMap(TickerEntry t) => {
    'symbol': t.symbol,
    'sortOrder': t.sortOrder,
    'groupId': t.groupId,
    'enabledAlertTypes': t.enabledAlertTypes.map((a) => a.name).toList(),
    'nextEarningsAt': t.nextEarningsAt?.toIso8601String(),
  };

  TickerEntry _tickerFromMap(Map<String, dynamic> m) {
    final rawTypes =
        (m['enabledAlertTypes'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];
    final alertTypes = rawTypes
        .map(
          (name) => AlertType.values.where((a) => a.name == name).firstOrNull,
        )
        .whereType<AlertType>()
        .toSet();

    return TickerEntry(
      symbol: (m['symbol'] as String).trim().toUpperCase(),
      sortOrder: (m['sortOrder'] as int?) ?? 0,
      groupId: m['groupId'] as String?,
      enabledAlertTypes: alertTypes.isEmpty
          ? const {AlertType.sma200CrossUp}
          : alertTypes,
      nextEarningsAt: m['nextEarningsAt'] != null
          ? DateTime.tryParse(m['nextEarningsAt'] as String)
          : null,
    );
  }
}
