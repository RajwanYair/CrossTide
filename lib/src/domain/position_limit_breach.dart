import 'package:equatable/equatable.dart';

/// Record of a position size limit breach event (S518).
class PositionLimitBreach extends Equatable {
  const PositionLimitBreach({
    required this.breachId,
    required this.ticker,
    required this.limitShares,
    required this.actualShares,
    required this.detectedAtMs,
    this.isActive = true,
  });

  final String breachId;
  final String ticker;

  /// Maximum position limit in shares.
  final int limitShares;

  /// Actual position size in shares when breach occurred.
  final int actualShares;

  /// Epoch milliseconds when the breach was detected.
  final int detectedAtMs;
  final bool isActive;

  int get excessShares => actualShares - limitShares;
  double get overagePercent =>
      limitShares == 0 ? 0 : excessShares / limitShares * 100;
  bool get isMajorBreach => overagePercent >= 20;

  @override
  List<Object?> get props => [
    breachId,
    ticker,
    limitShares,
    actualShares,
    detectedAtMs,
    isActive,
  ];
}
