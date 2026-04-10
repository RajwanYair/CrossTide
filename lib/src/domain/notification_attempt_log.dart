import 'package:equatable/equatable.dart';

/// Outcome of a single notification delivery attempt.
enum NotificationAttemptOutcome {
  /// Delivered successfully to the device.
  delivered,

  /// Delivery failed; retry may be scheduled.
  failed,

  /// Dropped — delivery window or budget exceeded.
  dropped,

  /// Pending; not yet attempted.
  pending,
}

/// Record of a single notification delivery attempt.
class NotificationAttemptEntry extends Equatable {
  const NotificationAttemptEntry({
    required this.attemptNumber,
    required this.attemptedAt,
    required this.outcome,
    this.errorMessage,
  });

  final int attemptNumber;
  final DateTime attemptedAt;
  final NotificationAttemptOutcome outcome;

  /// Error description. Non-null only on [NotificationAttemptOutcome.failed].
  final String? errorMessage;

  bool get wasSuccessful => outcome == NotificationAttemptOutcome.delivered;

  @override
  List<Object?> get props => [
    attemptNumber,
    attemptedAt,
    outcome,
    errorMessage,
  ];
}

/// Full delivery log for a single notification event.
class NotificationAttemptLog extends Equatable {
  const NotificationAttemptLog({
    required this.notificationId,
    required this.ticker,
    required this.alertType,
    required this.attempts,
    required this.scheduledAt,
  });

  final String notificationId;
  final String ticker;

  /// Alert type string matching AlertType enum name.
  final String alertType;

  final List<NotificationAttemptEntry> attempts;
  final DateTime scheduledAt;

  bool get wasDelivered =>
      attempts.any((NotificationAttemptEntry a) => a.wasSuccessful);

  int get totalAttempts => attempts.length;

  NotificationAttemptEntry? get lastAttempt =>
      attempts.isEmpty ? null : attempts.last;

  /// True when all attempts failed (no successful delivery).
  bool get isUndelivered => attempts.isNotEmpty && !wasDelivered;

  @override
  List<Object?> get props => [
    notificationId,
    ticker,
    alertType,
    attempts,
    scheduledAt,
  ];
}
