import 'package:equatable/equatable.dart';

/// Overall bullish/bearish grade for a composite signal score.
enum SignalScoreGrade { veryBullish, bullish, neutral, bearish, veryBearish }

/// Contribution of a single method to the composite score.
class SignalScoreComponent extends Equatable {
  const SignalScoreComponent({
    required this.methodName,
    required this.score,
    required this.weight,
  });

  final String methodName;

  /// Raw score for this component (-1.0 bearish to +1.0 bullish).
  final double score;

  /// Relative weight of this component (0.0–1.0). Weights sum to 1.0.
  final double weight;

  /// Weighted contribution.
  double get weightedScore => score * weight;

  @override
  List<Object?> get props => [methodName, score, weight];
}

/// Composite signal score aggregating multiple trading-method outputs
/// into a single 0–100 index with a letter-grade summary.
class CompositeSignalScore extends Equatable {
  const CompositeSignalScore({
    required this.ticker,
    required this.components,
    required this.evaluatedAt,
  });

  final String ticker;
  final List<SignalScoreComponent> components;
  final DateTime evaluatedAt;

  /// Weighted average score in range -1.0 to +1.0.
  double get rawScore {
    if (components.isEmpty) return 0;
    double sum = 0;
    for (final SignalScoreComponent c in components) {
      sum += c.weightedScore;
    }
    return sum;
  }

  /// Score normalised to 0–100 (50 = neutral).
  double get indexScore => (rawScore + 1) / 2 * 100;

  /// Letter-grade interpretation of the composite score.
  SignalScoreGrade get grade {
    final double s = indexScore;
    if (s >= 80) return SignalScoreGrade.veryBullish;
    if (s >= 60) return SignalScoreGrade.bullish;
    if (s >= 40) return SignalScoreGrade.neutral;
    if (s >= 20) return SignalScoreGrade.bearish;
    return SignalScoreGrade.veryBearish;
  }

  @override
  List<Object?> get props => [ticker, components, evaluatedAt];
}
