import 'package:equatable/equatable.dart';

/// Configuration for a regulatory filing or report (S521).
enum RegulatoryFilingFrequency { daily, weekly, monthly, quarterly, annually }

/// Configuration for a regulatory report (S521).
class RegulatoryReportConfig extends Equatable {
  const RegulatoryReportConfig({
    required this.configId,
    required this.regulatoryBody,
    required this.reportCode,
    required this.frequency,
    required this.submissionDeadlineDays,
    this.isEnabled = true,
  });

  final String configId;

  /// Regulator name, e.g. 'SEC', 'FINRA', 'ESMA'.
  final String regulatoryBody;

  /// Report identifier, e.g. 'Form 13F', 'EMIR TR'.
  final String reportCode;
  final RegulatoryFilingFrequency frequency;

  /// Calendar days after period-end to submit.
  final int submissionDeadlineDays;
  final bool isEnabled;

  bool get isUrgent => submissionDeadlineDays <= 5;
  bool get isAnnual => frequency == RegulatoryFilingFrequency.annually;

  @override
  List<Object?> get props => [
    configId,
    regulatoryBody,
    reportCode,
    frequency,
    submissionDeadlineDays,
    isEnabled,
  ];
}
