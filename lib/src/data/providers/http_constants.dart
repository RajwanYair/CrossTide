/// Centralized HTTP constants shared across all market data providers.
///
/// Avoids duplicating User-Agent strings, default timeouts, and other
/// HTTP configuration that was previously copy-pasted across 8+ providers.
abstract final class HttpConstants {
  /// User-Agent header value sent with every provider request.
  static const String userAgent = 'CrossTide/1.0';

  /// Default receive timeout for market data API calls.
  static const Duration defaultReceiveTimeout = Duration(seconds: 15);

  /// Default send timeout for market data API calls.
  static const Duration defaultSendTimeout = Duration(seconds: 10);
}
