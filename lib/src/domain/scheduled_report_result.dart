import 'package:equatable/equatable.dart';

/// Result of executing a scheduled report job (S498).
class ScheduledReportResult extends Equatable {
  const ScheduledReportResult({
    required this.resultId,
    required this.reportScheduleId,
    required this.totalRecipients,
    required this.successfulDeliveries,
    required this.durationMs,
    this.errorSummary = '',
  });

  final String resultId;
  final String reportScheduleId;

  /// Total number of configured recipients.
  final int totalRecipients;
  final int successfulDeliveries;

  /// Total execution time in milliseconds.
  final int durationMs;
  final String errorSummary;

  int get failedDeliveries => totalRecipients - successfulDeliveries;
  double get deliveryRatePercent => totalRecipients == 0
      ? 100.0
      : successfulDeliveries / totalRecipients * 100;
  bool get isFullSuccess => failedDeliveries == 0;
  bool get hasErrors => errorSummary.isNotEmpty;

  @override
  List<Object?> get props => [
    resultId,
    reportScheduleId,
    totalRecipients,
    successfulDeliveries,
    durationMs,
    errorSummary,
  ];
}
