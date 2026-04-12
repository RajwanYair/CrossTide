import 'package:equatable/equatable.dart';

/// AML (Anti-Money Laundering) screening flag record (S522).
enum AmlFlagSeverity { low, medium, high, critical }

/// AML screening result for a transaction or entity (S522).
class AmlFlagRecord extends Equatable {
  const AmlFlagRecord({
    required this.flagId,
    required this.entityId,
    required this.flagType,
    required this.severity,
    required this.flaggedAtMs,
    this.isCleared = false,
    this.notes = '',
  });

  final String flagId;

  /// Entity (account, ticker, or party) that triggered the flag.
  final String entityId;

  /// Code describing the type of AML concern.
  final String flagType;
  final AmlFlagSeverity severity;

  /// Epoch milliseconds when the flag was raised.
  final int flaggedAtMs;
  final bool isCleared;
  final String notes;

  bool get isCritical => severity == AmlFlagSeverity.critical;
  bool get isOpenHigh =>
      !isCleared &&
      (severity == AmlFlagSeverity.high ||
          severity == AmlFlagSeverity.critical);
  bool get hasNotes => notes.isNotEmpty;

  @override
  List<Object?> get props => [
    flagId,
    entityId,
    flagType,
    severity,
    flaggedAtMs,
    isCleared,
    notes,
  ];
}
