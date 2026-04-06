import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('IntradayQuote', () {
    final now = DateTime(2024, 6, 15, 10, 30);

    IntradayQuote quote({
      String symbol = 'AAPL',
      double price = 195.0,
      String marketState = 'REGULAR',
      double? preMarketPrice,
      double? postMarketPrice,
      DateTime? fetchedAt,
    }) => IntradayQuote(
      symbol: symbol,
      price: price,
      marketState: marketState,
      preMarketPrice: preMarketPrice,
      postMarketPrice: postMarketPrice,
      fetchedAt: fetchedAt ?? now,
    );

    test('isRegularHours true when REGULAR', () {
      expect(quote(marketState: 'REGULAR').isRegularHours, isTrue);
      expect(quote(marketState: 'PRE').isRegularHours, isFalse);
    });

    test('isPreMarket true when PRE', () {
      expect(quote(marketState: 'PRE').isPreMarket, isTrue);
      expect(quote(marketState: 'REGULAR').isPreMarket, isFalse);
    });

    test('isAfterHours true when POST', () {
      expect(quote(marketState: 'POST').isAfterHours, isTrue);
      expect(quote(marketState: 'CLOSED').isAfterHours, isFalse);
    });

    test('isStale false when just fetched', () {
      final q = quote(fetchedAt: DateTime.now());
      expect(q.isStale(), isFalse);
    });

    test('isStale true when older than ttl', () {
      final old = quote(
        fetchedAt: DateTime.now().subtract(const Duration(minutes: 5)),
      );
      expect(old.isStale(), isTrue);
    });

    test('isStale respects custom ttlMinutes', () {
      final q = quote(
        fetchedAt: DateTime.now().subtract(const Duration(minutes: 3)),
      );
      expect(q.isStale(ttlMinutes: 2), isTrue);
      expect(q.isStale(ttlMinutes: 5), isFalse);
    });

    test('two equal quotes have equal props', () {
      final a = IntradayQuote(
        symbol: 'AAPL',
        price: 195.0,
        fetchedAt: now,
        prevClose: 192.0,
        change: 3.0,
        changePct: 1.56,
        marketState: 'REGULAR',
      );
      final b = IntradayQuote(
        symbol: 'AAPL',
        price: 195.0,
        fetchedAt: now,
        prevClose: 192.0,
        change: 3.0,
        changePct: 1.56,
        marketState: 'REGULAR',
      );
      expect(a, equals(b));
      expect(a.props.length, 9);
    });
  });
}
