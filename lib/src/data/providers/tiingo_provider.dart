/// Tiingo Market Data Provider — free-tier JSON API.
///
/// Tiingo (tiingo.com) provides a well-documented REST API for US stock
/// daily OHLCV data. A **free API token** is required — sign up at
/// https://www.tiingo.com/account/api/token (no credit card required).
///
/// Store the token in FlutterSecureStorage under the key `tiingo_api_token`.
/// The app reads it at runtime via the optional [apiToken] parameter.
///
/// Endpoint: `https://api.tiingo.com/tiingo/daily/{ticker}/prices`
///
/// Advantages:
///   - Free forever tier: 50 requests/hour, 500 requests/day
///   - Clean JSON schema, reliable data
///   - No credit card required
///
/// Caveats:
///   - API token required (free signup)
///   - US equities only on free tier
///   - Rate limits: 50 req/hour, 500 req/day
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'market_data_provider.dart';
import 'proxy_detector.dart';

class TiingoProvider implements IMarketDataProvider {
  TiingoProvider({required this.apiToken, Dio? dio, Logger? logger})
    : _logger = logger ?? Logger(),
      _dio = dio ?? buildDioWithProxy(logger: logger);

  /// Tiingo API token. Obtain for free at https://www.tiingo.com/account/api/token
  final String apiToken;

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://api.tiingo.com/tiingo/daily';

  @override
  String get name => 'Tiingo (free token)';

  @override
  String get id => 'tiingo';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    final upper = ticker.toUpperCase().trim();
    _logger.i('Fetching daily history for $upper from Tiingo');
    final stopwatch = Stopwatch()..start();

    final now = DateTime.now();
    final twoYearsAgo = DateTime(now.year - 2, now.month, now.day);

    String fmtDate(DateTime d) =>
        '${d.year}-${d.month.toString().padLeft(2, '0')}-'
        '${d.day.toString().padLeft(2, '0')}';

    try {
      final response = await _dio.get<List<dynamic>>(
        '$_baseUrl/$upper/prices',
        queryParameters: {
          'startDate': fmtDate(twoYearsAgo),
          'endDate': fmtDate(now),
          'resampleFreq': 'daily',
          'token': apiToken,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CrossTide/1.0',
          },
          receiveTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 10),
        ),
      );

      final data = response.data;
      if (data == null || data.isEmpty) {
        throw MarketDataException(
          'Empty response from Tiingo for $upper',
          isRetryable: true,
        );
      }

      final candles = _parseJson(data, upper);

      stopwatch.stop();
      _logger.i(
        'Tiingo: $upper — ${candles.length} candles in '
        '${stopwatch.elapsedMilliseconds}ms',
      );
      return candles;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw const MarketDataException(
          'Tiingo: invalid or missing API token',
          statusCode: 401,
          isRetryable: false,
        );
      }
      throw MarketDataException(
        'Tiingo request failed for $upper: ${e.message}',
        statusCode: e.response?.statusCode,
        isRetryable: true,
      );
    }
  }

  /// Parse Tiingo JSON response into [DailyCandle] list.
  ///
  /// Each element looks like:
  /// ```json
  /// {
  ///   "date": "2025-01-02T00:00:00+00:00",
  ///   "open": 150.0, "high": 155.0, "low": 149.0,
  ///   "close": 153.0, "volume": 12345678
  /// }
  /// ```
  List<DailyCandle> _parseJson(List<dynamic> rows, String symbol) {
    final List<DailyCandle> candles = [];
    for (final dynamic row in rows) {
      final Map<String, dynamic> entry = row as Map<String, dynamic>;
      try {
        final String rawDate = entry['date'] as String;
        // Tiingo dates: "2025-01-02T00:00:00+00:00" — take the date prefix
        final DateTime date = DateTime.parse(rawDate.substring(0, 10));
        final double open = _toDouble(entry['open']);
        final double high = _toDouble(entry['high']);
        final double low = _toDouble(entry['low']);
        final double close = _toDouble(entry['close']);
        final int volume = _toInt(entry['volume']);
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

  static double _toDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    return double.parse(value.toString());
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.parse(value.toString());
  }
}
