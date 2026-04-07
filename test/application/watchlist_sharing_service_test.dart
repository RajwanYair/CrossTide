import 'package:cross_tide/src/application/watchlist_sharing_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = WatchlistSharingService();

  test('encodeShareLink creates valid URL', () {
    final url = service.encodeShareLink(tickers: ['AAPL', 'MSFT']);
    expect(url, contains('crosstide://share'));
    expect(url, contains('AAPL'));
    expect(url, contains('MSFT'));
  });

  test('decodeShareLink round-trips', () {
    final url = service.encodeShareLink(
      tickers: ['AAPL', 'GOOG'],
      profileName: 'aggressive',
    );
    final payload = service.decodeShareLink(url);
    expect(payload, isNotNull);
    expect(payload!.tickers, ['AAPL', 'GOOG']);
    expect(payload.profileName, 'aggressive');
  });

  test('decodeShareLink returns null for invalid URL', () {
    expect(service.decodeShareLink('https://example.com'), isNull);
  });
}
