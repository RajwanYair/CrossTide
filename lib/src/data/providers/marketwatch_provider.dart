/// MarketWatch Market Data Provider — free CSV endpoint, **no API key required**.
///
/// MarketWatch (marketwatch.com) provides a CSV download endpoint for
/// daily OHLCV data on US equities.
///
/// Endpoint:
/// `https://www.marketwatch.com/investing/stock/{symbol}/downloaddatapartial`
///   ?startdate=MM/DD/YYYY%2000:00:00
///   &enddate=MM/DD/YYYY%2000:00:00
///   &daterange=d30
///   &frequency=P1D
///   &csvdownload=true
///   &downloadpartial=false
///   &newdates=false
///
/// Advantages:
///   - No API key, no signup
///   - US equity OHLCV with volume
///   - Reliable data from Dow Jones / News Corp
///
/// Caveats:
///   - US stocks only (not international or crypto)
///   - Undocumented endpoint — may change without notice
///   - Returns newest-first (descending) — we reverse to ascending
///   - Date range limited per request; we request 2 years
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'http_constants.dart';
import 'market_data_provider.dart';
import 'proxy_detector.dart';

class MarketWatchProvider implements IMarketDataProvider {
  MarketWatchProvider({Dio? dio, Logger? logger})
    : _logger = logger ?? Logger(),
      _dio = dio ?? buildDioWithProxy(logger: logger);

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://www.marketwatch.com/investing/stock';

  @override
  String get name => 'MarketWatch (free, no key)';

  @override
  String get id => 'marketwatch';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    final upper = ticker.toUpperCase().trim();
    final lower = ticker.toLowerCase().trim();
    _logger.i('Fetching daily history for $upper from MarketWatch');
    final stopwatch = Stopwatch()..start();

    final now = DateTime.now();
    final twoYearsAgo = DateTime(now.year - 2, now.month, now.day);

    String formatDate(DateTime d) =>
        '${d.month.toString().padLeft(2, '0')}/'
        '${d.day.toString().padLeft(2, '0')}/'
        '${d.year} 00:00:00';

    try {
      final response = await _dio.get<String>(
        '$_baseUrl/$lower/downloaddatapartial',
        queryParameters: {
          'startdate': formatDate(twoYearsAgo),
          'enddate': formatDate(now),
          'daterange': 'd30',
          'frequency': 'P1D',
          'csvdownload': 'true',
          'downloadpartial': 'false',
          'newdates': 'false',
        },
        options: Options(
          responseType: ResponseType.plain,
          headers: {
            'User-Agent': HttpConstants.userAgent,
            'Accept': 'text/csv',
          },
          receiveTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 10),
        ),
      );

      final body = response.data;
      if (body == null || body.trim().isEmpty) {
        throw MarketDataException(
          'Empty response from MarketWatch for $upper',
          isRetryable: true,
        );
      }

      final candles = _parseCsv(body, upper);

      stopwatch.stop();
      _logger.i(
        'MarketWatch: $upper — ${candles.length} candles in '
        '${stopwatch.elapsedMilliseconds}ms',
      );
      return candles;
    } on DioException catch (e) {
      throw MarketDataException(
        'MarketWatch request failed for $upper: ${e.message}',
        statusCode: e.response?.statusCode,
        isRetryable: true,
      );
    }
  }

  /// Parse MarketWatch CSV format:
  /// ```
  /// Date, Open, High, Low, Close, Volume
  /// 04/04/2025, $220.00, $222.50, $219.00, $221.30, 45000000
  /// ```
  /// MarketWatch returns newest-first; we reverse to ascending order.
  /// Prices have a leading `$` that we strip.
  List<DailyCandle> _parseCsv(String csv, String symbol) {
    final lines = csv
        .split('\n')
        .map((String l) => l.trim())
        .where((String l) => l.isNotEmpty)
        .toList();

    if (lines.length < 2) {
      throw MarketDataException(
        'MarketWatch returned no data rows for $symbol',
      );
    }

    final candles = <DailyCandle>[];
    // Skip header row
    for (var i = 1; i < lines.length; i++) {
      final parts = _splitCsvLine(lines[i]);
      if (parts.length < 6) continue;

      try {
        final date = _parseDate(parts[0]);
        if (date == null) continue;

        final open = _parsePrice(parts[1]);
        final high = _parsePrice(parts[2]);
        final low = _parsePrice(parts[3]);
        final close = _parsePrice(parts[4]);
        final volume = _parseVolume(parts[5]);

        if (open == null || high == null || low == null || close == null) {
          continue;
        }

        candles.add(
          DailyCandle(
            date: date,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume,
          ),
        );
      } catch (_) {
        // Skip malformed rows
        continue;
      }
    }

    // Ensure ascending date order
    candles.sort((DailyCandle a, DailyCandle b) => a.date.compareTo(b.date));
    return candles;
  }

  /// Split a CSV line respecting double-quoted fields (e.g. `"38,500,000"`).
  List<String> _splitCsvLine(String line) {
    final fields = <String>[];
    final buffer = StringBuffer();
    var inQuotes = false;
    for (var j = 0; j < line.length; j++) {
      final ch = line[j];
      if (ch == '"') {
        inQuotes = !inQuotes;
      } else if (ch == ',' && !inQuotes) {
        fields.add(buffer.toString().trim());
        buffer.clear();
      } else {
        buffer.write(ch);
      }
    }
    fields.add(buffer.toString().trim());
    return fields;
  }

  /// Parse MM/DD/YYYY date format.
  DateTime? _parseDate(String s) {
    // MarketWatch uses "MM/DD/YYYY" format
    final parts = s.split('/');
    if (parts.length != 3) return null;
    final month = int.tryParse(parts[0]);
    final day = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);
    if (month == null || day == null || year == null) return null;
    return DateTime(year, month, day);
  }

  /// Parse price strings like "$220.00", "220.00" or `"$220.00"`.
  double? _parsePrice(String s) {
    final cleaned = s
        .replaceAll('"', '')
        .replaceAll('\$', '')
        .replaceAll(',', '');
    return double.tryParse(cleaned);
  }

  /// Parse volume strings like "45,000,000", `"45,000,000"` or "45000000".
  int _parseVolume(String s) {
    final cleaned = s.replaceAll('"', '').replaceAll(',', '');
    return int.tryParse(cleaned) ?? 0;
  }
}
