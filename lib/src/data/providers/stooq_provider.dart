/// Stooq Market Data Provider — free CSV endpoint, **no API key required**.
///
/// Stooq (stooq.com) is a Polish financial-data site that exposes a simple
/// CSV download URL for daily OHLCV data. US tickers use the `.US` suffix.
///
/// Endpoint: `https://stooq.com/q/d/l/?s={symbol}.US&i=d`
///
/// Advantages:
///   - No API key, no signup, no rate-limit headers
///   - Returns full history (years of daily candles)
///   - Simple CSV format: Date,Open,High,Low,Close,Volume
///
/// Caveats:
///   - Undocumented / unofficial — may change without notice
///   - No intraday data
///   - Returns most-recent date first (descending) — we reverse to ascending
///   - Returns empty CSV body (headers only) for unknown tickers
library;

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../domain/entities.dart';
import 'http_constants.dart';
import 'market_data_provider.dart';
import 'proxy_detector.dart';

class StooqProvider implements IMarketDataProvider {
  StooqProvider({Dio? dio, Logger? logger})
    : _logger = logger ?? Logger(),
      _dio = dio ?? buildDioWithProxy(logger: logger);

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://stooq.com/q/d/l/';

  @override
  String get name => 'Stooq (free, no key)';

  @override
  String get id => 'stooq';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    final upper = ticker.toUpperCase().trim();
    _logger.i('Fetching daily history for $upper from Stooq');
    final stopwatch = Stopwatch()..start();

    try {
      final response = await _dio.get<String>(
        _baseUrl,
        queryParameters: {'s': '$upper.US', 'i': 'd'},
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
          'Empty response from Stooq for $upper',
          isRetryable: true,
        );
      }

      final candles = _parseCsv(body, upper);

      stopwatch.stop();
      _logger.i(
        'Stooq: $upper — ${candles.length} candles in '
        '${stopwatch.elapsedMilliseconds}ms',
      );
      return candles;
    } on DioException catch (e) {
      throw MarketDataException(
        'Stooq request failed for $upper: ${e.message}',
        statusCode: e.response?.statusCode,
        isRetryable: true,
      );
    }
  }

  /// Parse Stooq CSV format:
  /// ```
  /// Date,Open,High,Low,Close,Volume
  /// 2025-04-04,220.00,222.50,219.00,221.30,45000000
  /// ```
  /// Stooq returns newest-first; we reverse to ascending order.
  List<DailyCandle> _parseCsv(String csv, String symbol) {
    final lines = csv
        .split('\n')
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty)
        .toList();

    if (lines.length < 2) {
      throw MarketDataException(
        'Stooq returned no data rows for $symbol '
        '(may be an unknown ticker)',
      );
    }

    // Skip header row
    final candles = <DailyCandle>[];
    for (var i = 1; i < lines.length; i++) {
      final parts = lines[i].split(',');
      if (parts.length < 6) continue;

      try {
        final date = DateTime.parse(parts[0]);
        final open = double.parse(parts[1]);
        final high = double.parse(parts[2]);
        final low = double.parse(parts[3]);
        final close = double.parse(parts[4]);
        final volume = int.tryParse(parts[5]) ?? 0;

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
    candles.sort((a, b) => a.date.compareTo(b.date));
    return candles;
  }
}
