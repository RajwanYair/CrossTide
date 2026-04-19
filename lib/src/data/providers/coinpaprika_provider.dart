/// Coinpaprika Market Data Provider — free REST API, **no API key required**.
///
/// API docs: https://api.coinpaprika.com/
///
/// Endpoint:
/// `https://api.coinpaprika.com/v1/coins/{coin-id}/ohlcv/historical`
///   ?start=YYYY-MM-DD&end=YYYY-MM-DD
///
/// Advantages:
///   - Completely free — no signup, no key, no rate-limit headers
///   - Full OHLCV data with volume (unlike CoinGecko OHLC endpoint)
///   - CORS enabled
///   - Covers 2,500+ crypto coins
///
/// Caveats:
///   - Crypto only — cannot fetch US stock tickers
///   - Coin must be referenced by Coinpaprika slug (e.g. "btc-bitcoin")
///   - Rate limit: 10 requests/second on the free tier
///   - Historical data limited to ~1 year on the free plan
///
/// Identification: tickers prefixed with `CRYPTO:` are routed here
/// (e.g. `CRYPTO:btc-bitcoin`, `CRYPTO:eth-ethereum`).
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'http_constants.dart';
import 'market_data_provider.dart';
import 'proxy_detector.dart';

class CoinpaprikaProvider implements IMarketDataProvider {
  CoinpaprikaProvider({Dio? dio, Logger? logger})
    : _logger = logger ?? Logger(),
      _dio = dio ?? buildDioWithProxy(logger: logger);

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://api.coinpaprika.com/v1';

  @override
  String get name => 'Coinpaprika (free, no key)';

  @override
  String get id => 'coinpaprika';

  /// Accepts tickers in `CRYPTO:<coinpaprika-slug>` format.
  /// Example: `CRYPTO:btc-bitcoin`, `CRYPTO:eth-ethereum`.
  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    final slug = _extractSlug(ticker);
    _logger.i('Fetching daily OHLCV for $slug from Coinpaprika');
    final stopwatch = Stopwatch()..start();

    final now = DateTime.now();
    final twoYearsAgo = DateTime(now.year - 2, now.month, now.day);
    final startDate = _formatDate(twoYearsAgo);
    final endDate = _formatDate(now);

    try {
      final response = await _dio.get<List<dynamic>>(
        '$_baseUrl/coins/$slug/ohlcv/historical',
        queryParameters: {'start': startDate, 'end': endDate},
        options: Options(
          headers: {
            'User-Agent': HttpConstants.userAgent,
            'Accept': 'application/json',
          },
          receiveTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 10),
        ),
      );

      final data = response.data;
      if (data == null || data.isEmpty) {
        throw MarketDataException(
          'Coinpaprika returned no data for $slug',
          isRetryable: true,
        );
      }

      final candles = _parseOhlcv(data, ticker.toUpperCase());

      stopwatch.stop();
      _logger.i(
        'Coinpaprika: $slug — ${candles.length} candles in '
        '${stopwatch.elapsedMilliseconds}ms',
      );
      return candles;
    } on DioException catch (e) {
      throw MarketDataException(
        'Coinpaprika request failed for $slug: ${e.message}',
        statusCode: e.response?.statusCode,
        isRetryable: e.response?.statusCode == 429,
      );
    }
  }

  /// Extract the Coinpaprika slug from `CRYPTO:btc-bitcoin` → `btc-bitcoin`.
  String _extractSlug(String ticker) {
    final trimmed = ticker.trim();
    if (trimmed.toUpperCase().startsWith('CRYPTO:')) {
      return trimmed.substring(7).toLowerCase();
    }
    return trimmed.toLowerCase();
  }

  /// Format date as `YYYY-MM-DD` for the API.
  String _formatDate(DateTime d) =>
      '${d.year}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';

  /// Parse the OHLCV response:
  /// ```json
  /// [
  ///   {
  ///     "time_open": "2024-01-01T00:00:00Z",
  ///     "time_close": "2024-01-01T23:59:59Z",
  ///     "open": 42000.0,
  ///     "high": 43500.0,
  ///     "low": 41800.0,
  ///     "close": 43200.0,
  ///     "volume": 12345678900,
  ///     "market_cap": 820000000000
  ///   }
  /// ]
  /// ```
  List<DailyCandle> _parseOhlcv(List<dynamic> data, String symbol) {
    final candles = <DailyCandle>[];

    for (final item in data) {
      if (item is! Map<String, dynamic>) continue;

      try {
        final timeOpen = item['time_open'] as String?;
        if (timeOpen == null) continue;
        final date = DateTime.parse(timeOpen);

        final open = (item['open'] as num?)?.toDouble();
        final high = (item['high'] as num?)?.toDouble();
        final low = (item['low'] as num?)?.toDouble();
        final close = (item['close'] as num?)?.toDouble();
        final volume = (item['volume'] as num?)?.toInt() ?? 0;

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
        continue;
      }
    }

    candles.sort((DailyCandle a, DailyCandle b) => a.date.compareTo(b.date));
    return candles;
  }
}
