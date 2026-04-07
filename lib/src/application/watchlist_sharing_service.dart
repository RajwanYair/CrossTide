/// Watchlist Sharing Service — application-layer orchestration.
///
/// Wraps [WatchlistShareCodec] to encode/decode shareable deep-link
/// URLs for watchlist tickers.
library;

import '../domain/domain.dart';

/// Orchestrates watchlist sharing via deep links.
class WatchlistSharingService {
  const WatchlistSharingService({
    WatchlistShareCodec codec = const WatchlistShareCodec(),
  }) : _codec = codec;

  final WatchlistShareCodec _codec;

  /// Encode a watchlist into a shareable URL string.
  String encodeShareLink({
    required List<String> tickers,
    String profileName = 'balanced',
  }) {
    return _codec.encode(
      WatchlistSharePayload(tickers: tickers, profileName: profileName),
    );
  }

  /// Decode a share URL.  Returns `null` if the URL is invalid.
  WatchlistSharePayload? decodeShareLink(String url) {
    return _codec.decode(url);
  }
}
