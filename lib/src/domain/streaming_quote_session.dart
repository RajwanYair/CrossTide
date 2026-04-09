/// Streaming Quote Session — WebSocket session configuration and state.
library;

import 'package:equatable/equatable.dart';

/// Connection state of a streaming quote session.
enum StreamingSessionState {
  /// Not yet connected.
  disconnected,

  /// Connection attempt in progress.
  connecting,

  /// Connected and receiving data.
  connected,

  /// Reconnecting after a dropped connection.
  reconnecting,

  /// Permanently closed; no further reconnect attempts.
  closed,
}

/// Protocol used by the streaming endpoint.
enum StreamingProtocol {
  /// Plain WebSocket (ws:// or wss://).
  websocket,

  /// Server-Sent Events over HTTP.
  serverSentEvents,

  /// Polling fallback — repeated HTTP requests.
  longPolling,
}

/// Configuration for establishing a real-time streaming quote connection.
class StreamingQuoteConfig extends Equatable {
  const StreamingQuoteConfig({
    required this.endpoint,
    required this.protocol,
    required this.tickers,
    this.heartbeatMs = 30000,
    this.maxReconnectAttempts = 5,
    this.reconnectBackoffMs = 2000,
    this.authToken,
  }) : assert(heartbeatMs >= 1000, 'heartbeatMs must be >= 1000'),
       assert(maxReconnectAttempts >= 0, 'must be non-negative'),
       assert(reconnectBackoffMs >= 500, 'backoffMs must be >= 500');

  /// WebSocket/SSE endpoint URL.
  final String endpoint;

  /// Protocol variant.
  final StreamingProtocol protocol;

  /// Ticker symbols to subscribe to.
  final List<String> tickers;

  /// How often to send a heartbeat (ms).
  final int heartbeatMs;

  /// Maximum reconnect attempts before giving up.
  final int maxReconnectAttempts;

  /// Initial reconnect back-off (ms); doubles on each failure.
  final int reconnectBackoffMs;

  /// Bearer token for authenticated endpoints (null = anonymous).
  final String? authToken;

  @override
  List<Object?> get props => [
        endpoint,
        protocol,
        tickers,
        heartbeatMs,
        maxReconnectAttempts,
        reconnectBackoffMs,
        authToken,
      ];
}

/// Snapshot of the current state of a streaming session.
class StreamingQuoteSession extends Equatable {
  const StreamingQuoteSession({
    required this.config,
    required this.state,
    required this.reconnectAttempts,
    this.connectedAt,
    this.lastMessageAt,
    this.errorMessage,
  });

  final StreamingQuoteConfig config;
  final StreamingSessionState state;

  /// Number of reconnect attempts since last successful connect.
  final int reconnectAttempts;

  final DateTime? connectedAt;
  final DateTime? lastMessageAt;

  /// Latest error description, if any.
  final String? errorMessage;

  bool get isActive => state == StreamingSessionState.connected;

  @override
  List<Object?> get props => [
        config,
        state,
        reconnectAttempts,
        connectedAt,
        lastMessageAt,
        errorMessage,
      ];
}
