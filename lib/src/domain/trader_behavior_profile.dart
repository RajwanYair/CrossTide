/// Trader Behavior Profile — classifies trader style from interaction history.
library;

import 'package:equatable/equatable.dart';

/// Inferred trading style from historical patterns.
enum TraderStyle {
  /// Very short holding periods (minutes to hours), uses intraday signals.
  scalper,

  /// Holds for days; focuses on short-term momentum breakouts.
  dayTrader,

  /// Holds for 1–4 weeks; uses swing highs/lows and moving averages.
  swingTrader,

  /// Holds for weeks to months; trend-following approach.
  momentumTrader,

  /// Long-term holder; minimal activity, fundamental + MA focus.
  positionTrader,

  /// Insufficient data to classify.
  unknown,
}

/// Risk appetite inferred from alert threshold choices.
enum RiskAppetite {
  /// Conservative — uses tighter thresholds, fewer false positives.
  conservative,

  /// Balanced — standard thresholds.
  balanced,

  /// Aggressive — wider thresholds, accepts more noise for earlier entries.
  aggressive,
}

/// A single observation recording the user's interaction with a signal.
class TraderBehaviorRecord extends Equatable {
  const TraderBehaviorRecord({
    required this.ticker,
    required this.alertType,
    required this.firedAt,
    required this.acknowledgedAt,
    this.actedWithinMinutes,
  });

  /// Ticker of the signal.
  final String ticker;

  /// Alert type that fired.
  final String alertType;

  /// When the alert fired.
  final DateTime firedAt;

  /// When the user acknowledged/dismissed the alert.
  final DateTime acknowledgedAt;

  /// Minutes from alert fire to user action (trade placed), or null if unknown.
  final int? actedWithinMinutes;

  /// Response latency in minutes.
  int get responseMinutes =>
      acknowledgedAt.difference(firedAt).inMinutes;

  @override
  List<Object?> get props => [
        ticker,
        alertType,
        firedAt,
        acknowledgedAt,
        actedWithinMinutes,
      ];
}

/// Aggregated trader behavioral profile derived from [TraderBehaviorRecord]s.
class TraderBehaviorProfile extends Equatable {
  const TraderBehaviorProfile({
    required this.style,
    required this.riskAppetite,
    required this.avgResponseMinutes,
    required this.mostUsedMethod,
    required this.totalObservations,
    required this.profileConfidence,
  }) : assert(
            profileConfidence >= 0.0 && profileConfidence <= 1.0,
            'profileConfidence must be 0.0–1.0');

  final TraderStyle style;
  final RiskAppetite riskAppetite;

  /// Average minutes between alert fire and acknowledgement.
  final double avgResponseMinutes;

  /// The trading method the trader engages with most.
  final String mostUsedMethod;

  /// Number of observations this profile was derived from.
  final int totalObservations;

  /// 0.0–1.0 confidence in this classification (higher with more observations).
  final double profileConfidence;

  /// Returns true when confidence is above 70% and at least 10 observations.
  bool get isReliable =>
      profileConfidence >= 0.7 && totalObservations >= 10;

  @override
  List<Object?> get props => [
        style,
        riskAppetite,
        avgResponseMinutes,
        mostUsedMethod,
        totalObservations,
        profileConfidence,
      ];
}

/// Classifies trader behavior from a list of records.
class TraderBehaviorClassifier {
  const TraderBehaviorClassifier();

  /// Minimum observations required for a reliable classification.
  static const _minObservations = 5;

  /// Classify a trader from their [records].
  TraderBehaviorProfile classify(List<TraderBehaviorRecord> records) {
    if (records.length < _minObservations) {
      return const TraderBehaviorProfile(
        style: TraderStyle.unknown,
        riskAppetite: RiskAppetite.balanced,
        avgResponseMinutes: 0,
        mostUsedMethod: '',
        totalObservations: 0,
        profileConfidence: 0.0,
      );
    }

    final avgResponse =
        records.fold<double>(0, (a, r) => a + r.responseMinutes) /
            records.length;

    // Classify style by average response time
    final style = _inferStyle(avgResponse);
    final riskAppetite = _inferRisk(records);
    final mostUsed = _mostUsedMethod(records);
    final confidence = _confidenceScore(records.length);

    return TraderBehaviorProfile(
      style: style,
      riskAppetite: riskAppetite,
      avgResponseMinutes: avgResponse,
      mostUsedMethod: mostUsed,
      totalObservations: records.length,
      profileConfidence: confidence,
    );
  }

  TraderStyle _inferStyle(double avgResponse) {
    if (avgResponse < 15) return TraderStyle.scalper;
    if (avgResponse < 60) return TraderStyle.dayTrader;
    if (avgResponse < 720) return TraderStyle.swingTrader;
    if (avgResponse < 7200) return TraderStyle.momentumTrader;
    return TraderStyle.positionTrader;
  }

  RiskAppetite _inferRisk(List<TraderBehaviorRecord> records) {
    final acted =
        records.where((r) => r.actedWithinMinutes != null).length;
    final ratio = acted / records.length;
    if (ratio < 0.25) return RiskAppetite.conservative;
    if (ratio > 0.65) return RiskAppetite.aggressive;
    return RiskAppetite.balanced;
  }

  String _mostUsedMethod(List<TraderBehaviorRecord> records) {
    final freq = <String, int>{};
    for (final r in records) {
      freq[r.alertType] = (freq[r.alertType] ?? 0) + 1;
    }
    if (freq.isEmpty) return '';
    return freq.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
  }

  double _confidenceScore(int n) {
    if (n >= 50) return 0.95;
    if (n >= 20) return 0.80;
    if (n >= 10) return 0.65;
    return 0.40;
  }
}
