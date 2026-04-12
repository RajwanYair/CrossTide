import 'package:equatable/equatable.dart';

/// Type of content displayed on a user insight card.
enum InsightCardType {
  /// Portfolio performance observation.
  performance,

  /// Risk concentration warning.
  riskWarning,

  /// Market opportunity suggestion.
  opportunity,

  /// Rebalance recommendation.
  rebalance,

  /// Earnings or dividend reminder.
  reminder,
}

/// A personalised insight card surfaced to the user in the dashboard.
class UserInsightCard extends Equatable {
  /// Creates a [UserInsightCard].
  const UserInsightCard({
    required this.cardId,
    required this.type,
    required this.title,
    required this.body,
    required this.priorityScore,
    this.isDismissed = false,
  });

  /// Unique identifier.
  final String cardId;

  /// Category of insight.
  final InsightCardType type;

  /// Short display title.
  final String title;

  /// Full insight message body.
  final String body;

  /// Priority score [0.0, 1.0]; higher = surfaced earlier.
  final double priorityScore;

  /// Whether the user has dismissed this card.
  final bool isDismissed;

  /// Returns `true` when the card is a warning type.
  bool get isWarning => type == InsightCardType.riskWarning;

  /// Returns `true` when the card is high-priority (score ≥ 0.7).
  bool get isHighPriority => priorityScore >= 0.70;

  /// Returns `true` when the card is actionable (visible and high-priority).
  bool get isActionable => !isDismissed && isHighPriority;

  @override
  List<Object?> get props => [
    cardId,
    type,
    title,
    body,
    priorityScore,
    isDismissed,
  ];
}
