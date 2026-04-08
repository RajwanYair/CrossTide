/// Nasdaq Historical Data Provider — unofficial JSON endpoint, **no API key**.
///
/// Uses the public NASDAQ website's unofficial historical data API to retrieve
/// daily OHLCV data for US-listed equities. No registration or API key needed.
///
/// Endpoint:
///   `https://api.nasdaq.com/api/quote/{symbol}/historical`
///   `?assetclass=stocks&fromdate={YYYY-MM-DD}&limit=9999&todate={YYYY-MM-DD}&type=1`
///
/// Advantages:
///   - No API key, no signup required
///   - US equities (NYSE, NASDAQ, AMEX) directly from NASDAQ
///   - Returns up to 10 years of daily OHLCV
///
/// Caveats:
///   - Unofficial, undocumented — may change or break without notice
///   - Requires a browser-like `User-Agent` and `Origin` header
///   - Pagination limited to ~9999 rows per request
///   - Volume is returned as a formatted string (e.g. "12,345,678")
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'market_data_provider.dart';
import 'proxy_detector.dart';

class NasdaqProvider implements IMarketDataProvider {
  NasdaqProvider({Dio? dio, Logger? logger})
    : _logger = logger ?? Logger(),
      _dio = dio ?? buildDioWithProxy(logger: logger);

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://api.nasdaq.com/api/quote';

  @override
  String get name => 'Nasdaq (free, no key)';

  @override
  String get id => 'nasdaq';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    final upper = ticker.toUpperCase().trim();
    _logger.i('Fetching daily history for $upper from Nasdaq');
    final stopwatch = Stopwatch()..start();

    final now = DateTime.now();
    final twoYearsAgo = DateTime(now.year - 2, now.month, now.day);

    String fmtDate(DateTime d) =>
        '${d.year}-${d.month.toString().padLeft(2, '0')}-'
        '${d.day.toString().padLeft(2, '0')}';

    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '$_baseUrl/$upper/historical',
        queryParameters: {
          'assetclass': 'stocks',
          'fromdate': fmtDate(twoYearsAgo),
          'todate': fmtDate(now),
          'limit': '9999',
          'type': '1',
        },
        options: Options(
          headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 Chrome/120 Safari/537.36',
            'Origin': 'https://www.nasdaq.com',
            'Referer': 'https://www.nasdaq.com/',
            'Accept': 'application/json, text/plain, */*',
          },
          receiveTimeout: const Duration(seconds: 20),
          sendTimeout: const Duration(seconds: 10),
        ),
      );

      final body = response.data;
      if (body == null) {
        throw MarketDataException(
          'Empty response from Nasdaq for $upper',
          isRetryable: true,
        );
      }

      final candles = _parseJson(body, upper);

      stopwatch.stop();
      _logger.i(
        'Nasdaq: $upper — ${candles.length} candles in '
        '${stopwatch.elapsedMilliseconds}ms',
      );
      return candles;
    } on DioException catch (e) {
      throw MarketDataException(
        'Nasdaq request failed for $upper: ${e.message}',
        statusCode: e.response?.statusCode,
        isRetryable: true,
      );
    }
  }

  /// Parse Nasdaq JSON response into [DailyCandle] list.
  ///
  /// Expected shape:
  /// ```json
  /// {
  ///   "data": {
  ///     "tradesTable": {
  ///       "rows": [
  ///         {"date": "01/02/2025", "close": "$153.00", "volume": "12,345,678",
  ///          "open": "$150.00", "high": "$155.00", "low": "$149.00"}
  ///       ]
  ///     }
  ///   }
  /// }
  /// ```
  /// Rows are newest-first; we sort ascending by date.
  List<DailyCandle> _parseJson(Map<String, dynamic> body, String symbol) {
    final data = body['data'] as Map<String, dynamic>?;
    if (data == null) {
      throw MarketDataException('Nasdaq: missing "data" key for $symbol');
    }
    final tradesTable = data['tradesTable'] as Map<String, dynamic>?;
    if (tradesTable == null) {
      throw MarketDataException(
        'Nasdaq: missing "tradesTable" key for $symbol',
      );
    }
    final rawRows = tradesTable['rows'];
    if (rawRows == null || rawRows is! List) {
      throw MarketDataException('Nasdaq: no rows returned for $symbol');
    }

    final List<DailyCandle> candles = [];
    for (final dynamic row in rawRows) {
      final Map<String, dynamic> r = row as Map<String, dynamic>;
      try {
        // Date format: "MM/DD/YYYY"
        final String rawDate = r['date'] as String;
        final parts = rawDate.split('/');
        if (parts.length != 3) continue;
        final DateTime date = DateTime(
          int.parse(parts[2]),
          int.parse(parts[0]),
          int.parse(parts[1]),
        );

        final double close = _stripAndParse(r['close']);
        final double open = _stripAndParse(r['open']);
        final double high = _stripAndParse(r['high']);
        final double low = _stripAndParse(r['low']);
        final int volume = _parseVolume(r['volume']);

        if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
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
        continue;
      }
    }
    candles.sort((DailyCandle a, DailyCandle b) => a.date.compareTo(b.date));
    return candles;
  }

  /// Strip leading `$` and parse as double.
  static double _stripAndParse(dynamic value) {
    final String s = value.toString().replaceAll(r'$', '').replaceAll(',', '');
    return double.parse(s);
  }

  /// Parse volume formatted as "12,345,678".
  static int _parseVolume(dynamic value) {
    final String s = value.toString().replaceAll(',', '');
    return int.tryParse(s) ?? 0;
  }
}
