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
import 'http_constants.dart';
import 'market_data_provider.dart';
import 'proxy_detector.dart';
import 'ticker_company_profile.dart';

class YahooFinanceProvider implements IMarketDataProvider {
  YahooFinanceProvider({Dio? dio, Logger? logger})
    : _logger = logger ?? Logger(),
      _dio = dio ?? buildDioWithProxy(logger: logger);

  final Dio _dio;
  final Logger _logger;

  static const _baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';

  @override
  String get name => 'Yahoo Finance (free, no key)';

  @override
  String get id => 'yahoo_finance';

  @override
  Future<List<DailyCandle>> fetchDailyHistory(String ticker) async {
    return _fetchHistory(ticker);
  }

  /// Fetches only candles since [since] using Yahoo's period1/period2 params.
  ///
  /// Returns an empty list (not an error) when no new candles exist.
  /// Throws [MarketDataException] on network or parse errors.
  Future<List<DailyCandle>> fetchDailyHistoryDelta(
    String ticker,
    DateTime since,
  ) async {
    // period1 is one day before [since] so we always get at least the overlap
    // candle for idempotent merging.
    final period1 =
        since.subtract(const Duration(days: 1)).millisecondsSinceEpoch ~/ 1000;
    final period2 = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    return _fetchHistory(ticker, period1: period1, period2: period2);
  }

  Future<List<DailyCandle>> _fetchHistory(
    String ticker, {
    int? period1,
    int? period2,
  }) async {
    _logger.i('Fetching daily history for $ticker from Yahoo Finance');
    final stopwatch = Stopwatch()..start();

    try {
      final queryParams = period1 != null
          ? {
              'period1': '$period1',
              'period2': '$period2',
              'interval': '1d',
              'includePrePost': 'false',
              'events': '',
            }
          : {
              'range': '2y', // 2 years ≈ 500+ trading days (need 201+)
              'interval': '1d',
              'includePrePost': 'false',
              'events': '', // skip dividends/splits for speed
            };
      final response = await _dio.get<Map<String, dynamic>>(
        '$_baseUrl/$ticker',
        queryParameters: queryParams,
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

  /// Fetches a real-time quote for [ticker].
  ///
  /// Uses the v8 chart API with `range=1d` and `interval=1m` to get the
  /// current session's latest traded price, previous close, and market state.
  /// Returns null on any error (non-critical — display falls back to EOD data).
  Future<IntradayQuote?> fetchQuote(String ticker) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '$_baseUrl/${ticker.toUpperCase()}',
        queryParameters: {
          'range': '1d',
          'interval': '1m',
          'includePrePost': 'true',
        },
        options: Options(
          headers: {
            'User-Agent': HttpConstants.userAgent,
            'Accept': 'application/json',
          },
          receiveTimeout: const Duration(seconds: 10),
          sendTimeout: const Duration(seconds: 8),
        ),
      );
      final data = response.data;
      if (data == null) return null;
      final chart = data['chart'] as Map<String, dynamic>?;
      final resultList = chart?['result'] as List<dynamic>?;
      if (resultList == null || resultList.isEmpty) return null;
      final result = resultList.first as Map<String, dynamic>;
      final meta = result['meta'] as Map<String, dynamic>?;
      if (meta == null) return null;

      final price = (meta['regularMarketPrice'] as num?)?.toDouble();
      final prevClose =
          (meta['chartPreviousClose'] as num?)?.toDouble() ??
          (meta['previousClose'] as num?)?.toDouble();
      final marketState = meta['marketState'] as String? ?? 'CLOSED';
      final preMarket = (meta['preMarketPrice'] as num?)?.toDouble();
      final postMarket = (meta['postMarketPrice'] as num?)?.toDouble();

      if (price == null) return null;

      final change = prevClose != null ? price - prevClose : null;
      final changePct = (change != null && prevClose != null && prevClose != 0)
          ? (change / prevClose) * 100
          : null;

      return IntradayQuote(
        symbol: ticker.toUpperCase(),
        price: price,
        prevClose: prevClose,
        change: change,
        changePct: changePct,
        marketState: marketState,
        preMarketPrice: preMarket,
        postMarketPrice: postMarket,
        fetchedAt: DateTime.now(),
      );
    } catch (e) {
      _logger.d('$ticker: intraday quote fetch failed (non-critical): $e');
      return null;
    }
  }

  /// Fetches the next expected earnings date from Yahoo Finance quoteSummary.  ///
  /// Returns null if unavailable or on network error (non-critical).
  Future<DateTime?> fetchNextEarnings(String ticker) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        'https://query1.finance.yahoo.com/v11/finance/quoteSummary/${ticker.toUpperCase()}',
        queryParameters: {'modules': 'calendarEvents'},
        options: Options(
          headers: {
            'User-Agent': HttpConstants.userAgent,
            'Accept': 'application/json',
          },
          receiveTimeout: const Duration(seconds: 10),
          sendTimeout: const Duration(seconds: 8),
        ),
      );
      final data = response.data;
      if (data == null) return null;
      final summary = (data['quoteSummary'] as Map<String, dynamic>?);
      final result =
          (summary?['result'] as List<dynamic>?)?.firstOrNull
              as Map<String, dynamic>?;
      final cal = result?['calendarEvents'] as Map<String, dynamic>?;
      final earnings = cal?['earnings'] as Map<String, dynamic>?;
      final dates = earnings?['earningsDate'] as List<dynamic>?;
      if (dates == null || dates.isEmpty) return null;
      // earningsDate is a list of {raw: unixTimestamp, fmt: "YYYY-MM-DD"}
      final first = dates.first as Map<String, dynamic>?;
      final raw = first?['raw'] as num?;
      if (raw == null) return null;
      final dt = DateTime.fromMillisecondsSinceEpoch(
        raw.toInt() * 1000,
        isUtc: true,
      ).toLocal();
      _logger.d('$ticker: next earnings = $dt');
      return dt;
    } catch (e) {
      _logger.d('$ticker: earnings fetch failed (non-critical): $e');
      return null;
    }
  }

  /// Fetches company profile data for [ticker] from Yahoo Finance quoteSummary.
  ///
  /// Uses modules=assetProfile,summaryDetail (no API key required).
  /// Returns a [TickerCompanyProfile] or null on any failure (non-critical).
  Future<TickerCompanyProfile?> fetchCompanyProfile(String ticker) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        'https://query1.finance.yahoo.com/v11/finance/quoteSummary/${ticker.toUpperCase()}',
        queryParameters: {'modules': 'assetProfile,quoteType'},
        options: Options(
          headers: {
            'User-Agent': HttpConstants.userAgent,
            'Accept': 'application/json',
          },
          receiveTimeout: const Duration(seconds: 10),
          sendTimeout: const Duration(seconds: 8),
        ),
      );
      final data = response.data;
      if (data == null) return null;
      final summary = data['quoteSummary'] as Map<String, dynamic>?;
      final result =
          (summary?['result'] as List<dynamic>?)?.firstOrNull
              as Map<String, dynamic>?;
      if (result == null) return null;

      final assetProfile = result['assetProfile'] as Map<String, dynamic>?;
      final quoteType = result['quoteType'] as Map<String, dynamic>?;

      final longName =
          (quoteType?['longName'] as String?)?.trim() ??
          (quoteType?['shortName'] as String?)?.trim();
      final sector = assetProfile?['sector'] as String?;
      final industry = assetProfile?['industry'] as String?;
      final rawSummary = assetProfile?['longBusinessSummary'] as String?;

      // Truncate description to 300 chars for display, ending at a sentence.
      String? description;
      if (rawSummary != null && rawSummary.isNotEmpty) {
        if (rawSummary.length <= 300) {
          description = rawSummary;
        } else {
          final cut = rawSummary.substring(0, 300);
          final lastDot = cut.lastIndexOf('.');
          description = lastDot > 100
              ? rawSummary.substring(0, lastDot + 1)
              : '$cut…';
        }
      }

      final industryStr = [
        if (sector != null && sector.isNotEmpty) sector,
        if (industry != null && industry.isNotEmpty) industry,
      ].join(' • ');

      return TickerCompanyProfile(
        symbol: ticker.toUpperCase(),
        longName: longName,
        description: description,
        industry: industryStr.isEmpty ? null : industryStr,
      );
    } catch (e) {
      _logger.d('$ticker: company profile fetch failed (non-critical): $e');
      return null;
    }
  }
}
