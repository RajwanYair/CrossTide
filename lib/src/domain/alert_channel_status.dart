import 'package:equatable/equatable.dart';

/// Delivery channel for a notification alert.
enum AlertChannelType {
  /// System push notification.
  push,

  /// In-app notification panel.
  inApp,

  /// Email delivery.
  email,

  /// SMS delivery.
  sms,

  /// Webhook/API endpoint.
  webhook,
}

/// Operational status of a notification alert delivery channel.
class AlertChannelStatus extends Equatable {
  /// Creates an [AlertChannelStatus].
  const AlertChannelStatus({
    required this.channel,
    required this.isEnabled,
    required this.lastTestedAt,
    this.failureReason,
    this.consecutiveFailures = 0,
  });

  /// The delivery channel this status describes.
  final AlertChannelType channel;

  /// Whether the channel is currently active.
  final bool isEnabled;

  /// Most recent health-check timestamp.
  final DateTime lastTestedAt;

  /// Last recorded failure message (`null` when healthy).
  final String? failureReason;

  /// Number of consecutive delivery failures.
  final int consecutiveFailures;

  /// Returns `true` when enabled and no consecutive failures.
  bool get isHealthy => isEnabled && consecutiveFailures == 0;

  /// Returns `true` when consecutive failures exceed 3 — degraded state.
  bool get isDegraded => consecutiveFailures > 3;

  @override
  List<Object?> get props => [
    channel,
    isEnabled,
    lastTestedAt,
    failureReason,
    consecutiveFailures,
  ];
}
