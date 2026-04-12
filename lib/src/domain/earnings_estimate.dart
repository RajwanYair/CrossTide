import 'package:equatable/equatable.dart';

/// Analyst consensus earnings estimate for a single ticker.
class EarningsEstimate extends Equatable {
  /// Creates an [EarningsEstimate].
  const EarningsEstimate({
    required this.ticker,
    required this.fiscalQuarter,
    required this.analystCount,
    required this.epsConsensus,
    required this.epsHigh,
    required this.epsLow,
    required this.revenueConsensusMillions,
  });

  /// Ticker symbol.
  final String ticker;

  /// Target fiscal quarter (e.g. `'Q2 2025'`).
  final String fiscalQuarter;

  /// Number of analysts contributing to the consensus.
  final int analystCount;

  /// Consensus EPS estimate.
  final double epsConsensus;

  /// Highest individual EPS estimate.
  final double epsHigh;

  /// Lowest individual EPS estimate.
  final double epsLow;

  /// Revenue consensus estimate in millions of dollars.
  final double revenueConsensusMillions;

  /// Returns `true` when at least 3 analysts contributed.
  bool get hasConsensus => analystCount >= 3;

  /// Range between the highest and lowest EPS estimate.
  double get epsRange => epsHigh - epsLow;

  /// Returns `true` when analyst estimates are tightly clustered (range ≤ 0.10).
  bool get isHighAgreement => epsRange <= 0.10;

  @override
  List<Object?> get props => [
    ticker,
    fiscalQuarter,
    analystCount,
    epsConsensus,
    epsHigh,
    epsLow,
    revenueConsensusMillions,
  ];
}
