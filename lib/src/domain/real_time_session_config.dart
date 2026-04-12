import 'package:equatable/equatable.dart';

/// Transport layer used for the real-time session.
enum RealTimeTransport { websocket, serverSentEvents, polling }

/// Configuration for a WebSocket or streaming real-time session
/// handling live quotes and order-book updates.
class RealTimeSessionConfig extends Equatable {
  const RealTimeSessionConfig({
    required this.sessionId,
    required this.transport,
    required this.endpointUrl,
    required this.subscriptionTickers,
    required this.heartbeatIntervalSeconds,
    required this.reconnectMaxAttempts,
    this.compressionEnabled = false,
  });

  final String sessionId;
  final RealTimeTransport transport;
  final String endpointUrl;
  final List<String> subscriptionTickers;
  final int heartbeatIntervalSeconds;
  final int reconnectMaxAttempts;
  final bool compressionEnabled;

  RealTimeSessionConfig copyWith({
    String? sessionId,
    RealTimeTransport? transport,
    String? endpointUrl,
    List<String>? subscriptionTickers,
    int? heartbeatIntervalSeconds,
    int? reconnectMaxAttempts,
    bool? compressionEnabled,
  }) => RealTimeSessionConfig(
    sessionId: sessionId ?? this.sessionId,
    transport: transport ?? this.transport,
    endpointUrl: endpointUrl ?? this.endpointUrl,
    subscriptionTickers: subscriptionTickers ?? this.subscriptionTickers,
    heartbeatIntervalSeconds:
        heartbeatIntervalSeconds ?? this.heartbeatIntervalSeconds,
    reconnectMaxAttempts: reconnectMaxAttempts ?? this.reconnectMaxAttempts,
    compressionEnabled: compressionEnabled ?? this.compressionEnabled,
  );

  @override
  List<Object?> get props => [
    sessionId,
    transport,
    endpointUrl,
    subscriptionTickers,
    heartbeatIntervalSeconds,
    reconnectMaxAttempts,
    compressionEnabled,
  ];
}
