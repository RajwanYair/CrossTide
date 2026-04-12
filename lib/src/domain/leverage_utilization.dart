import 'package:equatable/equatable.dart';

/// Margin/leverage utilization snapshot for a portfolio (S525).
class LeverageUtilization extends Equatable {
  const LeverageUtilization({
    required this.portfolioId,
    required this.grossExposureUsd,
    required this.netAssetValueUsd,
    required this.marginUsedUsd,
    required this.marginAvailableUsd,
    required this.capturedAtMs,
  });

  final String portfolioId;

  /// Sum of long + short gross exposure.
  final double grossExposureUsd;

  /// Net asset value (equity) of the portfolio.
  final double netAssetValueUsd;
  final double marginUsedUsd;
  final double marginAvailableUsd;

  /// Epoch milliseconds for this snapshot.
  final int capturedAtMs;

  double get grossLeverageRatio =>
      netAssetValueUsd == 0 ? 0 : grossExposureUsd / netAssetValueUsd;
  double get marginUtilizationPercent {
    final total = marginUsedUsd + marginAvailableUsd;
    return total == 0 ? 0 : marginUsedUsd / total * 100;
  }

  bool get isHighLeverage => grossLeverageRatio >= 3.0;
  bool get isMarginCallRisk => marginUtilizationPercent >= 85;

  @override
  List<Object?> get props => [
    portfolioId,
    grossExposureUsd,
    netAssetValueUsd,
    marginUsedUsd,
    marginAvailableUsd,
    capturedAtMs,
  ];
}
