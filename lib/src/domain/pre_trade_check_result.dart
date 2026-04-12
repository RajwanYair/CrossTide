import 'package:equatable/equatable.dart';

/// Pre-trade risk check result before order submission (S528).
enum PreTradeCheckStatus { passed, softWarning, hardBlocked }

/// Result of a pre-trade risk validation (S528).
class PreTradeCheckResult extends Equatable {
  const PreTradeCheckResult({
    required this.checkId,
    required this.orderId,
    required this.status,
    this.failedRules = const [],
    this.warningMessages = const [],
    required this.checkedAtMs,
  });

  final String checkId;
  final String orderId;
  final PreTradeCheckStatus status;

  /// Rule codes that caused hard blocks.
  final List<String> failedRules;

  /// Human-readable warning messages.
  final List<String> warningMessages;

  /// Epoch milliseconds when the check ran.
  final int checkedAtMs;

  bool get isPassed => status == PreTradeCheckStatus.passed;
  bool get isBlocked => status == PreTradeCheckStatus.hardBlocked;
  bool get hasWarnings => warningMessages.isNotEmpty;

  @override
  List<Object?> get props => [
    checkId,
    orderId,
    status,
    failedRules,
    warningMessages,
    checkedAtMs,
  ];
}
