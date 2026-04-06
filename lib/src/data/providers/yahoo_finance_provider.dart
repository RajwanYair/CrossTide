/// Yahoo Finance Market Data Provider.
///
/// Uses the public Yahoo Finance chart API (v8) which requires NO API key.
/// Endpoint: https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
///
/// Rate limits: Unofficial — be polite (1-2 req/sec max).
/// Returns up to 20+ years of daily OHLCV data.
///
/// Fallback host: query2.finance.yahoo.com (same API, different CDN).
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'market_data_provider.dart';

class YahooFinanceProvider implements IMarketDataProvider {
  YahooFinanceProvider({Dio? dio, Logger? logger})
    : _dio = dio ?? Dio(),
      _logger = logger ?? Logger();

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';

  @override
  String get name => 'Yahoo Finance (free, no key)';

  @override
  String get id => 'yahoo_finance';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    _logger.i('Fetching daily history for $ticker from Yahoo Finance');
    final stopwatch = Stopwatch()..start();

    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '$_baseUrl/$ticker',
        queryParameters: {
          'range': '2y', // 2 years ≈ 500+ trading days (need 201+)
          'interval': '1d',
          'includePrePost': 'false',
          'events': '', // skip dividends/splits for speed
        },
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
      if (data == null) {
        throw const MarketDataException('Empty response from Yahoo Finance');
      }

      final chart = data['chart'] as Map<String, dynamic>?;
      if (chart == null) {
        throw const MarketDataException('Invalid response structure');
      }

      // Check for errors
      final error = chart['error'] as Map<String, dynamic>?;
      if (error != null) {
        final code = error['code'] as String? ?? 'Unknown';
        final description = error['description'] as String? ?? 'Unknown error';
        throw MarketDataException(
          '$code: $description',
          isRetryable: code == 'Too Many Requests',
        );
      }

      final results = chart['result'] as List<dynamic>?;
      if (results == null || results.isEmpty) {
        throw MarketDataException(
          'No data found for $ticker — check the symbol is valid',
          isRetryable: false,
        );
      }

      final result = results[0] as Map<String, dynamic>;
      final timestamps = (result['timestamp'] as List<dynamic>?)?.cast<int>();
      final indicators = result['indicators'] as Map<String, dynamic>?;
      final quotes =
          (indicators?['quote'] as List<dynamic>?)?.firstOrNull
              as Map<String, dynamic>?;

      if (timestamps == null || quotes == null) {
        throw const MarketDataException(
          'Missing timestamp or quote data',
          isRetryable: true,
        );
      }

      final opens = (quotes['open'] as List<dynamic>?)?.cast<num?>();
      final highs = (quotes['high'] as List<dynamic>?)?.cast<num?>();
      final lows = (quotes['low'] as List<dynamic>?)?.cast<num?>();
      final closes = (quotes['close'] as List<dynamic>?)?.cast<num?>();
      final volumes = (quotes['volume'] as List<dynamic>?)?.cast<num?>();

      if (opens == null ||
          highs == null ||
          lows == null ||
          closes == null ||
          volumes == null) {
        throw const MarketDataException(
          'Incomplete OHLCV data',
          isRetryable: true,
        );
      }

      final candles = <DailyCandle>[];
      for (var i = 0; i < timestamps.length; i++) {
        // Yahoo sometimes returns null values for days with no trading
        final close = closes[i];
        final open = opens[i];
        final high = highs[i];
        final low = lows[i];
        final volume = volumes[i];

        if (close == null || open == null || high == null || low == null) {
          continue; // Skip days with missing data
        }

        candles.add(
          DailyCandle(
            date: DateTime.fromMillisecondsSinceEpoch(
              timestamps[i] * 1000,
              isUtc: true,
            ).toLocal(),
            open: open.toDouble(),
            high: high.toDouble(),
            low: low.toDouble(),
            close: close.toDouble(),
            volume: volume?.toInt() ?? 0,
          ),
        );
      }

      // Sort ascending by date (usually already sorted, but be safe)
      candles.sort((a, b) => a.date.compareTo(b.date));

      stopwatch.stop();
      _logger.i(
        'Fetched ${candles.length} candles for $ticker in '
        '${stopwatch.elapsedMilliseconds}ms',
      );

      if (candles.length < 201) {
        _logger.w(
          '$ticker: only ${candles.length} candles (need 201+ for SMA200). '
          'Consider a longer range.',
        );
      }

      return candles;
    } on DioException catch (e) {
      stopwatch.stop();
      _logger.e('Network error fetching $ticker: ${e.message}');

      if (e.response?.statusCode == 404) {
        throw MarketDataException(
          'Ticker "$ticker" not found on Yahoo Finance',
          statusCode: 404,
          isRetryable: false,
        );
      }

      throw MarketDataException(
        e.message ?? 'Network error',
        statusCode: e.response?.statusCode,
        isRetryable: e.type != DioExceptionType.badResponse,
      );
    }
  }
}
