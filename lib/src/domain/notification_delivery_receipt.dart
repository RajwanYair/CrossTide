import 'package:equatable/equatable.dart';

/// Notification delivery receipt — per-alert delivery outcome audit.
enum NotificationDeliveryOutcome {
  delivered,
  failed,
  throttled,
  skipped,
  quietHours,
}

class NotificationDeliveryReceipt extends Equatable {
  const NotificationDeliveryReceipt({
    required this.alertId,
    required this.channel,
    required this.outcome,
    required this.attemptCount,
    required this.deliveredAt,
  });

  final String alertId;
  final String channel;
  final NotificationDeliveryOutcome outcome;
  final int attemptCount;
  final DateTime deliveredAt;

  NotificationDeliveryReceipt copyWith({
    String? alertId,
    String? channel,
    NotificationDeliveryOutcome? outcome,
    int? attemptCount,
    DateTime? deliveredAt,
  }) => NotificationDeliveryReceipt(
    alertId: alertId ?? this.alertId,
    channel: channel ?? this.channel,
    outcome: outcome ?? this.outcome,
    attemptCount: attemptCount ?? this.attemptCount,
    deliveredAt: deliveredAt ?? this.deliveredAt,
  );

  @override
  List<Object?> get props => [
    alertId,
    channel,
    outcome,
    attemptCount,
    deliveredAt,
  ];
}
