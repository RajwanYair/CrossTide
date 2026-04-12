import 'package:equatable/equatable.dart';

/// ESG composite score snapshot for a ticker (S529).
class EsgScoreSnapshot extends Equatable {
  const EsgScoreSnapshot({
    required this.ticker,
    required this.environmentScore,
    required this.socialScore,
    required this.governanceScore,
    required this.compositeScore,
    required this.scoredAtMs,
    this.provider = '',
  });

  final String ticker;

  /// Environmental score 0–100.
  final double environmentScore;

  /// Social score 0–100.
  final double socialScore;

  /// Governance score 0–100.
  final double governanceScore;

  /// Composite weighted ESG score 0–100.
  final double compositeScore;

  /// Epoch milliseconds when scored.
  final int scoredAtMs;

  /// Data provider name, e.g. 'MSCI', 'Sustainalytics'.
  final String provider;

  bool get isHighEsg => compositeScore >= 70;
  bool get isLowEsg => compositeScore < 30;
  bool get isGovernanceLead =>
      governanceScore >= environmentScore && governanceScore >= socialScore;

  @override
  List<Object?> get props => [
    ticker,
    environmentScore,
    socialScore,
    governanceScore,
    compositeScore,
    scoredAtMs,
    provider,
  ];
}
