import 'package:equatable/equatable.dart';

/// A point-in-time snapshot of selected macroeconomic indicators.
class MacroEconomicSnapshot extends Equatable {
  /// Creates a [MacroEconomicSnapshot].
  const MacroEconomicSnapshot({
    required this.snapshotId,
    required this.capturedAt,
    required this.gdpGrowthPct,
    required this.inflationPct,
    required this.unemploymentPct,
    required this.centralBankRatePct,
    required this.yieldCurve10y2yBps,
  });

  /// Unique identifier for this snapshot.
  final String snapshotId;

  /// Timestamp when the snapshot was captured.
  final DateTime capturedAt;

  /// Annualised GDP growth rate in percent.
  final double gdpGrowthPct;

  /// CPI-based inflation rate in percent.
  final double inflationPct;

  /// Unemployment rate in percent.
  final double unemploymentPct;

  /// Central bank policy rate in percent.
  final double centralBankRatePct;

  /// 10-year minus 2-year Treasury yield spread in basis points.
  final int yieldCurve10y2yBps;

  /// Returns `true` when the yield curve is inverted.
  bool get isYieldCurveInverted => yieldCurve10y2yBps < 0;

  /// Returns `true` when traditional recessionary signals are present.
  bool get isRecessionarySignal => isYieldCurveInverted && gdpGrowthPct < 0.0;

  /// Returns `true` when inflation exceeds 3%.
  bool get isHighInflation => inflationPct > 3.0;

  @override
  List<Object?> get props => [
    snapshotId,
    capturedAt,
    gdpGrowthPct,
    inflationPct,
    unemploymentPct,
    centralBankRatePct,
    yieldCurve10y2yBps,
  ];
}
