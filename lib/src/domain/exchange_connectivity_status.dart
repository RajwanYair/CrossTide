import 'package:equatable/equatable.dart';

/// Status of a connection to an exchange or data provider.
enum ConnectivityStatus {
  connected,
  degraded,
  reconnecting,
  disconnected,
  maintenance,
}

/// Connectivity status snapshot for a named exchange or data feed.
class ExchangeConnectivityStatus extends Equatable {
  const ExchangeConnectivityStatus({
    required this.exchangeId,
    required this.displayName,
    required this.status,
    required this.latencyMs,
    required this.checkedAt,
    this.statusMessage,
  });

  final String exchangeId;
  final String displayName;
  final ConnectivityStatus status;

  /// Round-trip latency in milliseconds (-1 when unavailable).
  final int latencyMs;

  final DateTime checkedAt;

  /// Optional human-readable status message.
  final String? statusMessage;

  bool get isConnected => status == ConnectivityStatus.connected;

  bool get isOperational =>
      status == ConnectivityStatus.connected ||
      status == ConnectivityStatus.degraded;

  /// Returns true when latency is measured and within acceptable range (<= 500 ms).
  bool get isLowLatency => latencyMs >= 0 && latencyMs <= 500;

  @override
  List<Object?> get props => [
    exchangeId,
    displayName,
    status,
    latencyMs,
    checkedAt,
    statusMessage,
  ];
}
