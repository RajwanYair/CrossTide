import 'package:equatable/equatable.dart';

/// Detected compliance rule violation record (S516).
class ComplianceRuleViolation extends Equatable {
  const ComplianceRuleViolation({
    required this.violationId,
    required this.ruleCode,
    required this.description,
    required this.affectedTicker,
    required this.severityScore,
    required this.detectedAtMs,
    this.isResolved = false,
  });

  final String violationId;
  final String ruleCode;
  final String description;
  final String affectedTicker;

  /// Severity score 1–10 (10 = most severe).
  final int severityScore;

  /// Epoch milliseconds when the violation was detected.
  final int detectedAtMs;
  final bool isResolved;

  bool get isCritical => severityScore >= 8;
  bool get isMinor => severityScore <= 3;
  bool get requiresImmediateAction => isCritical && !isResolved;

  @override
  List<Object?> get props => [
    violationId,
    ruleCode,
    description,
    affectedTicker,
    severityScore,
    detectedAtMs,
    isResolved,
  ];
}
