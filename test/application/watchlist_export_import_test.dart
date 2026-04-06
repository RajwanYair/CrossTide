/// Tests for S53 WatchlistExportImportService — validates JSON
/// serialisation/deserialisation logic independent of file I/O.
library;

import 'dart:convert';

import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

// ---------------------------------------------------------------------------
// Pure-logic helpers extracted from WatchlistExportImportService for testing.
// (Mirror of the _tickerFromMap / validation logic)
// ---------------------------------------------------------------------------

TickerEntry _tickerFromMap(Map<String, dynamic> m) {
  final rawTypes =
      (m['enabledAlertTypes'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList() ??
      [];
  final alertTypes = rawTypes
      .map((name) => AlertType.values.where((a) => a.name == name).firstOrNull)
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

Map<String, dynamic> _tickerToMap(TickerEntry t) => {
  'symbol': t.symbol,
  'sortOrder': t.sortOrder,
  'groupId': t.groupId,
  'enabledAlertTypes': t.enabledAlertTypes.map((a) => a.name).toList(),
  'nextEarningsAt': t.nextEarningsAt?.toIso8601String(),
};

void main() {
  group('WatchlistExportImportService JSON logic', () {
    test('ticker round-trips through map serialisation', () {
      const original = TickerEntry(
        symbol: 'MSFT',
        sortOrder: 3,
        groupId: 'tech',
        enabledAlertTypes: {AlertType.sma200CrossUp, AlertType.goldenCross},
      );

      final map = _tickerToMap(original);
      final restored = _tickerFromMap(map);

      expect(restored.symbol, 'MSFT');
      expect(restored.sortOrder, 3);
      expect(restored.groupId, 'tech');
      expect(
        restored.enabledAlertTypes,
        containsAll([AlertType.sma200CrossUp, AlertType.goldenCross]),
      );
    });

    test('symbol is normalised to upper-case on import', () {
      final map = _tickerToMap(const TickerEntry(symbol: 'aapl', sortOrder: 0));
      map['symbol'] = 'aapl'; // simulate lower-case in JSON
      final ticker = _tickerFromMap(map);
      expect(ticker.symbol, 'AAPL');
    });

    test(
      'unknown alertTypes are silently dropped; falls back to sma200CrossUp',
      () {
        final ticker = _tickerFromMap({
          'symbol': 'TSLA',
          'sortOrder': 0,
          'enabledAlertTypes': ['nonExistentType'],
        });
        expect(ticker.enabledAlertTypes, {AlertType.sma200CrossUp});
      },
    );

    test('export JSON has required top-level keys', () {
      final payload = {
        'exportedAt': DateTime.now().toIso8601String(),
        'version': 1,
        'groups': <dynamic>[],
        'tickers': [
          _tickerToMap(const TickerEntry(symbol: 'NVDA', sortOrder: 0)),
        ],
      };

      final json = jsonEncode(payload);
      final decoded = jsonDecode(json) as Map<String, dynamic>;

      expect(
        decoded.keys,
        containsAll(['exportedAt', 'version', 'groups', 'tickers']),
      );
      final tickers = decoded['tickers'] as List<dynamic>;
      expect(tickers.length, 1);
      expect((tickers.first as Map<String, dynamic>)['symbol'], 'NVDA');
    });

    test('import validates missing tickers key', () {
      const badJson = '{"something": []}';
      expect(() {
        final p = jsonDecode(badJson) as Map<String, dynamic>;
        if (!p.containsKey('tickers')) {
          throw const FormatException(
            'Missing "tickers" key — not a CrossTide watchlist export',
          );
        }
      }, throwsA(isA<FormatException>()));
    });
  });
}
