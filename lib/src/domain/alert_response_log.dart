import 'package:equatable/equatable.dart';

/// A response from a user to an in-app alert action prompt.
class AlertResponseLog extends Equatable {
  /// Creates an [AlertResponseLog].
  const AlertResponseLog({
    required this.responseId,
    required this.alertId,
    required this.ticker,
    required this.actionKey,
    required this.respondedAt,
    this.durationMs,
  });

  /// Unique identifier for this response record.
  final String responseId;

  /// ID of the alert that was responded to.
  final String alertId;

  /// Ticker symbol the alert referred to.
  final String ticker;

  /// Identifier of the action chosen (e.g. `'dismiss'`, `'view_chart'`,
  /// `'buy_now'`).
  final String actionKey;

  /// Timestamp when the user responded.
  final DateTime respondedAt;

  /// Time in milliseconds from alert delivery to user response
  /// (`null` when not tracked).
  final int? durationMs;

  /// Returns `true` when the user dismissed without further action.
  bool get isDismissed => actionKey == 'dismiss';

  /// Returns `true` when the user took a constructive action.
  bool get isEngaged => actionKey != 'dismiss';

  @override
  List<Object?> get props => [
    responseId,
    alertId,
    ticker,
    actionKey,
    respondedAt,
    durationMs,
  ];
}
