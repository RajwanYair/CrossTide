/// CoinGecko Market Data Provider — free REST API, **no API key required**.
///
/// API docs: https://docs.coingecko.com/reference/introduction
///
/// Endpoint: `https://api.coingecko.com/api/v3/coins/{id}/market_chart?vs_currency=usd&days=730`
///
/// Advantages:
///   - Completely free tier (demo) — no signup, no key
///   - Covers 10,000+ crypto coins
///   - Returns daily OHLCV if `days > 90`, otherwise finer granularity
///
/// Caveats:
///   - Crypto only — cannot fetch US stock tickers
///   - Rate limit: ~10-30 calls/minute on the free tier
///   - Coin must be referenced by CoinGecko slug (e.g. "bitcoin", "ethereum")
///   - No open/high/low on the market_chart endpoint — we approximate OHLC
///     using the OHLC endpoint instead
///
/// Identification: tickers prefixed with `CRYPTO:` are routed here
/// (e.g. `CRYPTO:bitcoin`, `CRYPTO:ethereum`).
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'market_data_provider.dart';
import 'proxy_detector.dart';

class CoinGeckoProvider implements IMarketDataProvider {
  CoinGeckoProvider({Dio? dio, Logger? logger})
    : _logger = logger ?? Logger(),
      _dio = dio ?? buildDioWithProxy(logger: logger);

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://api.coingecko.com/api/v3';

  @override
  String get name => 'CoinGecko (free, no key)';

  @override
  String get id => 'coingecko';

  /// Accepts tickers in `CRYPTO:<coingecko-slug>` format.
  /// Example: `CRYPTO:bitcoin`, `CRYPTO:ethereum`.
  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    final slug = _extractSlug(ticker);
    _logger.i('Fetching daily OHLC for $slug from CoinGecko');
    final stopwatch = Stopwatch()..start();

    try {
      // /coins/{id}/ohlc returns [timestamp, open, high, low, close]
      // days=365 → daily candles for the last year
      final response = await _dio.get<List<dynamic>>(
        '$_baseUrl/coins/$slug/ohlc',
        queryParameters: {'vs_currency': 'usd', 'days': '730'},
        options: Options(
          headers: {
            'User-Agent': 'CrossTide/1.0',
            'Accept': 'application/json',
          },
          receiveTimeout: const Duration(seconds: 15),
          sendTimeout: const Duration(seconds: 10),
        ),
      );

      final data = response.data;
      if (data == null || data.isEmpty) {
        throw MarketDataException(
          'CoinGecko returned no data for $slug',
          isRetryable: true,
        );
      }

      final candles = _parseOhlc(data, ticker.toUpperCase());

      stopwatch.stop();
      _logger.i(
        'CoinGecko: $slug — ${candles.length} candles in '
        '${stopwatch.elapsedMilliseconds}ms',
      );
      return candles;
    } on DioException catch (e) {
      throw MarketDataException(
        'CoinGecko request failed for $slug: ${e.message}',
        statusCode: e.response?.statusCode,
        isRetryable: e.response?.statusCode == 429,
      );
    }
  }

  /// Extract the CoinGecko slug from `CRYPTO:bitcoin` → `bitcoin`.
  String _extractSlug(String ticker) {
    final upper = ticker.trim();
    if (upper.toUpperCase().startsWith('CRYPTO:')) {
      return upper.substring(7).toLowerCase();
    }
    // Fallback: treat the whole ticker as a slug
    return upper.toLowerCase();
  }

  /// Parse the OHLC response: `[[timestamp, open, high, low, close], ...]`
  List<DailyCandle> _parseOhlc(List<dynamic> data, String symbol) {
    final candles = <DailyCandle>[];

    for (final row in data) {
      if (row is! List || row.length < 5) continue;

      try {
        final timestamp = (row[0] as num).toInt();
        final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
        final open = (row[1] as num).toDouble();
        final high = (row[2] as num).toDouble();
        final low = (row[3] as num).toDouble();
        final close = (row[4] as num).toDouble();

        candles.add(
          DailyCandle(
            date: date,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: 0, // OHLC endpoint doesn't include volume
          ),
        );
      } catch (_) {
        continue;
      }
    }

    candles.sort((a, b) => a.date.compareTo(b.date));
    return candles;
  }
}
