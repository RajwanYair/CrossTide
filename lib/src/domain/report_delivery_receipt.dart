import 'package:equatable/equatable.dart';

/// Delivery method for a report receipt (S496).
enum ReportDeliveryMethod { email, inApp, webhook, push }

/// Acknowledgement record for a scheduled report delivery (S496).
class ReportDeliveryReceipt extends Equatable {
  const ReportDeliveryReceipt({
    required this.receiptId,
    required this.reportScheduleId,
    required this.deliveryMethod,
    required this.recipientAddress,
    required this.isDelivered,
    required this.durationMs,
    this.failureReason = '',
  });

  final String receiptId;
  final String reportScheduleId;
  final ReportDeliveryMethod deliveryMethod;

  /// Email address, webhook URL, or user identifier.
  final String recipientAddress;
  final bool isDelivered;

  /// Round-trip delivery time in milliseconds.
  final int durationMs;
  final String failureReason;

  bool get hasFailed => !isDelivered;
  bool get hasFailureReason => failureReason.isNotEmpty;
  bool get isFastDelivery => durationMs <= 2000;

  @override
  List<Object?> get props => [
    receiptId,
    reportScheduleId,
    deliveryMethod,
    recipientAddress,
    isDelivered,
    durationMs,
    failureReason,
  ];
}
