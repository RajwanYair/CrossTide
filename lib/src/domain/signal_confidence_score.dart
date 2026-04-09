/// Signal Confidence Score — ML-estimated quality score for a trading signal.
library;

import 'package:equatable/equatable.dart';

/// Category of evidence that contributes to the confidence estimate.
enum ConfidenceFactorType {
  /// How often past instances of this pattern were profitable.
  historicalWinRate,

  /// Agreement across multiple technical methods (consensus alignment).
  technicalAlignment,

  /// Volume confirms the price move.
  volumeConfirmation,

  /// How strong the prevailing market regime is.
  marketRegime,

  /// Signal occurred during a historically favorable time of day.
  timingFavorability,
}

/// A single evidence factor and its contribution to overall confidence.
class ConfidenceFactor extends Equatable {
  const ConfidenceFactor({
    required this.type,
    required this.value,
    required this.weight,
  }) : assert(
         value >= 0.0 && value <= 1.0,
         'value must be in [0.0, 1.0]',
       ),
       assert(
         weight > 0.0 && weight <= 1.0,
         'weight must be in (0.0, 1.0]',
       );

  final ConfidenceFactorType type;

  /// Evidence strength: 0.0 (weakest) to 1.0 (strongest).
  final double value;

  /// Relative importance of this factor in the overall score: 0.0–1.0.
  final double weight;

  @override
  List<Object?> get props => [type, value, weight];
}

/// ML-estimated quality score for a signal, combining multiple evidence factors.
class AlertConfidenceScore extends Equatable {
  const AlertConfidenceScore({
    required this.ticker,
    required this.signalType,
    required this.factors,
    required this.overallScore,
    required this.computedAt,
  }) : assert(
         overallScore >= 0.0 && overallScore <= 1.0,
         'overallScore must be in [0.0, 1.0]',
       );

  final String ticker;

  /// Short label for the triggering signal (e.g. 'micho_buy', 'consensus_green').
  final String signalType;

  final List<ConfidenceFactor> factors;

  /// Weighted mean of all factor values: 0.0 (lowest) to 1.0 (highest).
  final double overallScore;

  final DateTime computedAt;

  /// Returns true when [overallScore] is ≥ 0.75.
  bool get isHighConfidence => overallScore >= 0.75;

  /// Computes the weighted-average score from [factors].
  static double computeScore(List<ConfidenceFactor> factors) {
    if (factors.isEmpty) return 0.0;
    final totalWeight = factors.fold(0.0, (double s, ConfidenceFactor f) => s + f.weight);
    if (totalWeight == 0.0) return 0.0;
    final weightedSum = factors.fold(
      0.0,
      (double s, ConfidenceFactor f) => s + f.value * f.weight,
    );
    return weightedSum / totalWeight;
  }

  @override
  List<Object?> get props => [
    ticker,
    signalType,
    factors,
    overallScore,
    computedAt,
  ];
}
