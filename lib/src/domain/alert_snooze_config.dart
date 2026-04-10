import 'package:equatable/equatable.dart';

/// Alert snooze configuration for a specific ticker or method.
class AlertSnoozeConfig extends Equatable {
  const AlertSnoozeConfig({
    required this.configId,
    required this.ticker,
    required this.snoozeUntil,
    required this.createdAt,
    this.methodKey,
    this.reason,
  });

  final String configId;
  final String ticker;

  /// Optional method key to restrict snooze to a single method.
  final String? methodKey;

  /// The snooze expires at this instant.
  final DateTime snoozeUntil;

  final DateTime createdAt;

  final String? reason;

  /// Returns true when the snooze is still active relative to [now].
  bool isActiveAt(DateTime now) => now.isBefore(snoozeUntil);

  /// Returns true when this snooze applies to all methods for the ticker.
  bool get isGlobal => methodKey == null;

  @override
  List<Object?> get props => [
    configId,
    ticker,
    methodKey,
    snoozeUntil,
    createdAt,
    reason,
  ];
}
