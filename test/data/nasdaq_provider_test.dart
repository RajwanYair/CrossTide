import 'package:cross_tide/src/data/providers/market_data_provider.dart';
import 'package:cross_tide/src/data/providers/nasdaq_provider.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

// ---------------------------------------------------------------------------
// Fake Dio adapter
// ---------------------------------------------------------------------------

class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this._responseBody, {this.statusCode = 200});

  final String _responseBody;
  final int statusCode;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return ResponseBody.fromString(
      _responseBody,
      statusCode,
      headers: {
        'content-type': ['application/json; charset=utf-8'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

Dio _dio(String body, {int statusCode = 200}) {
  final dio = Dio(BaseOptions(baseUrl: 'https://fake.test'));
  dio.httpClientAdapter = _FakeAdapter(body, statusCode: statusCode);
  return dio;
}

// ---------------------------------------------------------------------------
// Canned Nasdaq JSON response
// ---------------------------------------------------------------------------

String _nasdaqJson(List<Map<String, String>> rows) {
  final rowsJson = rows
      .map((r) {
        return '{"date":"${r['date']}","close":"${r['close']}","volume":"${r['volume']}","open":"${r['open']}","high":"${r['high']}","low":"${r['low']}"}';
      })
      .join(',');
  return '{"data":{"tradesTable":{"rows":[$rowsJson]}}}';
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('NasdaqProvider', () {
    test('id and name', () {
      final provider = NasdaqProvider();
      expect(provider.id, 'nasdaq');
      expect(provider.name, contains('Nasdaq'));
    });

    test('parses valid JSON response correctly', () async {
      final body = _nasdaqJson([
        {
          'date': '01/07/2025',
          'open': r'$150.00',
          'high': r'$156.00',
          'low': r'$149.00',
          'close': r'$154.00',
          'volume': '12,345,678',
        },
        {
          'date': '01/06/2025',
          'open': r'$148.00',
          'high': r'$152.00',
          'low': r'$147.00',
          'close': r'$151.00',
          'volume': '9,876,543',
        },
      ]);

      final provider = NasdaqProvider(dio: _dio(body));
      final candles = await provider.fetchDailyHistory('AAPL');

      expect(candles, hasLength(2));
      // Sorted ascending: 01/06 before 01/07
      expect(candles.first.date, DateTime(2025, 1, 6));
      expect(candles.last.date, DateTime(2025, 1, 7));
      expect(candles.last.close, closeTo(154.0, 0.01));
      expect(candles.first.volume, 9876543);
    });

    test('returns candles sorted ascending by date', () async {
      final body = _nasdaqJson([
        {
          'date': '03/01/2025',
          'open': r'$200.00',
          'high': r'$205.00',
          'low': r'$198.00',
          'close': r'$203.00',
          'volume': '5,000,000',
        },
        {
          'date': '01/15/2025',
          'open': r'$180.00',
          'high': r'$185.00',
          'low': r'$178.00',
          'close': r'$182.00',
          'volume': '4,000,000',
        },
      ]);

      final provider = NasdaqProvider(dio: _dio(body));
      final candles = await provider.fetchDailyHistory('MSFT');

      expect(candles.first.date, DateTime(2025, 1, 15));
      expect(candles.last.date, DateTime(2025, 3, 1));
    });

    test('skips rows with zero prices', () async {
      final body = _nasdaqJson([
        {
          'date': '01/07/2025',
          'open': r'$0.00',
          'high': r'$0.00',
          'low': r'$0.00',
          'close': r'$0.00',
          'volume': '0',
        },
        {
          'date': '01/06/2025',
          'open': r'$148.00',
          'high': r'$152.00',
          'low': r'$147.00',
          'close': r'$151.00',
          'volume': '1,000,000',
        },
      ]);

      final provider = NasdaqProvider(dio: _dio(body));
      final candles = await provider.fetchDailyHistory('T');
      expect(candles, hasLength(1));
    });

    test('throws MarketDataException when data key is missing', () {
      const body = '{"status":"ok"}';
      final provider = NasdaqProvider(dio: _dio(body));
      expect(
        () => provider.fetchDailyHistory('AAPL'),
        throwsA(isA<MarketDataException>()),
      );
    });

    test('throws MarketDataException when tradesTable is missing', () {
      const body = '{"data":{"otherKey":{}}}';
      final provider = NasdaqProvider(dio: _dio(body));
      expect(
        () => provider.fetchDailyHistory('AAPL'),
        throwsA(isA<MarketDataException>()),
      );
    });

    test('handles volumes with no commas', () async {
      final body = _nasdaqJson([
        {
          'date': '02/01/2025',
          'open': r'$120.00',
          'high': r'$125.00',
          'low': r'$119.00',
          'close': r'$123.00',
          'volume': '765432',
        },
      ]);
      final provider = NasdaqProvider(dio: _dio(body));
      final candles = await provider.fetchDailyHistory('GOOG');
      expect(candles.first.volume, 765432);
    });

    test('skips malformed date rows gracefully', () async {
      final goodRow = {
        'date': '01/06/2025',
        'open': r'$148.00',
        'high': r'$152.00',
        'low': r'$147.00',
        'close': r'$151.00',
        'volume': '1,000,000',
      };
      // Insert a row with a bad date that will be caught by the try/catch
      final body =
          '{"data":{"tradesTable":{"rows":['
          '{"date":"baddate","close":"\$100","volume":"1000","open":"\$100","high":"\$102","low":"\$99"},'
          '{"date":"${goodRow['date']}","close":"${goodRow['close']}","volume":"${goodRow['volume']}","open":"${goodRow['open']}","high":"${goodRow['high']}","low":"${goodRow['low']}"}'
          ']}}}';

      final provider = NasdaqProvider(dio: _dio(body));
      final candles = await provider.fetchDailyHistory('AAPL');
      expect(candles, hasLength(1));
    });
  });
}
