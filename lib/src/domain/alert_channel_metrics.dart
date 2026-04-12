import 'package:equatable/equatable.dart';

/// Aggregate metrics for a single alert delivery channel over a time period.
class AlertChannelMetrics extends Equatable {
  const AlertChannelMetrics({
    required this.channelName,
    required this.sentCount,
    required this.deliveredCount,
    required this.failedCount,
    required this.averageDeliveryMs,
    required this.periodStart,
    required this.periodEnd,
  });

  final String channelName;
  final int sentCount;
  final int deliveredCount;
  final int failedCount;

  /// Average delivery latency in milliseconds.
  final double averageDeliveryMs;

  final DateTime periodStart;
  final DateTime periodEnd;

  AlertChannelMetrics copyWith({
    String? channelName,
    int? sentCount,
    int? deliveredCount,
    int? failedCount,
    double? averageDeliveryMs,
    DateTime? periodStart,
    DateTime? periodEnd,
  }) => AlertChannelMetrics(
    channelName: channelName ?? this.channelName,
    sentCount: sentCount ?? this.sentCount,
    deliveredCount: deliveredCount ?? this.deliveredCount,
    failedCount: failedCount ?? this.failedCount,
    averageDeliveryMs: averageDeliveryMs ?? this.averageDeliveryMs,
    periodStart: periodStart ?? this.periodStart,
    periodEnd: periodEnd ?? this.periodEnd,
  );

  @override
  List<Object?> get props => [
    channelName,
    sentCount,
    deliveredCount,
    failedCount,
    averageDeliveryMs,
    periodStart,
    periodEnd,
  ];
}
