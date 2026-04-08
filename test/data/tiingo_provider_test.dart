import 'package:cross_tide/src/data/providers/market_data_provider.dart';
import 'package:cross_tide/src/data/providers/tiingo_provider.dart';
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
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('TiingoProvider', () {
    test('id and name', () {
      final provider = TiingoProvider(apiToken: 'test_token');
      expect(provider.id, 'tiingo');
      expect(provider.name, contains('Tiingo'));
    });

    test('parses valid JSON array correctly', () async {
      const json = '''
[
  {
    "date": "2025-01-02T00:00:00+00:00",
    "open": 150.0, "high": 155.0, "low": 148.0,
    "close": 153.0, "volume": 10000000
  },
  {
    "date": "2025-01-03T00:00:00+00:00",
    "open": 153.5, "high": 158.0, "low": 151.0,
    "close": 157.0, "volume": 12000000
  }
]
''';

      final provider = TiingoProvider(apiToken: 'test', dio: _dio(json));
      final candles = await provider.fetchDailyHistory('AAPL');

      expect(candles, hasLength(2));
      // Sorted ascending
      expect(candles.first.date, DateTime(2025, 1, 2));
      expect(candles.last.date, DateTime(2025, 1, 3));
      expect(candles.first.open, closeTo(150.0, 0.01));
      expect(candles.first.close, closeTo(153.0, 0.01));
      expect(candles.first.volume, 10000000);
    });

    test('returns candles sorted ascending by date', () async {
      const json = '''
[
  {"date":"2025-03-01T00:00:00+00:00","open":200.0,"high":205.0,"low":198.0,"close":203.0,"volume":5000000},
  {"date":"2025-01-15T00:00:00+00:00","open":180.0,"high":185.0,"low":178.0,"close":182.0,"volume":4000000}
]
''';
      final provider = TiingoProvider(apiToken: 'test', dio: _dio(json));
      final candles = await provider.fetchDailyHistory('MSFT');

      expect(candles.first.date, DateTime(2025, 1, 15));
      expect(candles.last.date, DateTime(2025, 3, 1));
    });

    test('skips rows with zero or negative prices', () async {
      const json = '''
[
  {"date":"2025-01-02T00:00:00+00:00","open":0.0,"high":0.0,"low":0.0,"close":0.0,"volume":0},
  {"date":"2025-01-03T00:00:00+00:00","open":100.0,"high":105.0,"low":98.0,"close":103.0,"volume":1000000}
]
''';
      final provider = TiingoProvider(apiToken: 'test', dio: _dio(json));
      final candles = await provider.fetchDailyHistory('T');
      expect(candles, hasLength(1));
      expect(candles.first.close, closeTo(103.0, 0.01));
    });

    test('throws MarketDataException on empty array', () async {
      final provider = TiingoProvider(apiToken: 'test', dio: _dio('[]'));
      expect(
        () => provider.fetchDailyHistory('AAPL'),
        throwsA(isA<MarketDataException>()),
      );
    });

    test(
      'throws MarketDataException with statusCode 401 on bad token',
      () async {
        final provider = TiingoProvider(
          apiToken: 'bad',
          dio: _dio('{"detail":"Not found."}', statusCode: 401),
        );
        try {
          await provider.fetchDailyHistory('AAPL');
          fail('Expected MarketDataException');
        } on MarketDataException catch (e) {
          expect(e.statusCode, 401);
          expect(e.isRetryable, isFalse);
        }
      },
    );

    test('handles int volume values', () async {
      const json = '''
[
  {"date":"2025-02-01T00:00:00+00:00","open":120,"high":125,"low":119,"close":123,"volume":7654321}
]
''';
      final provider = TiingoProvider(apiToken: 'test', dio: _dio(json));
      final candles = await provider.fetchDailyHistory('GOOG');
      expect(candles, hasLength(1));
      expect(candles.first.volume, 7654321);
      expect(candles.first.open, closeTo(120.0, 0.01));
    });
  });
}
