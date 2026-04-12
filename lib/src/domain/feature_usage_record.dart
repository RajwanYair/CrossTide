import 'package:equatable/equatable.dart';

/// Tracks usage metrics for a specific app feature.
class FeatureUsageRecord extends Equatable {
  /// Creates a [FeatureUsageRecord].
  const FeatureUsageRecord({
    required this.featureId,
    required this.featureName,
    required this.totalActivations,
    required this.uniqueUsers,
    required this.lastActivatedAt,
    this.isExperimental = false,
  });

  /// Machine-readable feature identifier.
  final String featureId;

  /// Human-readable feature name.
  final String featureName;

  /// Total number of times this feature has been activated.
  final int totalActivations;

  /// Number of distinct users who have used this feature.
  final int uniqueUsers;

  /// Timestamp of the most recent activation.
  final DateTime lastActivatedAt;

  /// Whether this feature is experimental / behind a flag.
  final bool isExperimental;

  /// Returns `true` when the feature has been widely adopted (≥ 100 users).
  bool get isWidelyAdopted => uniqueUsers >= 100;

  /// Returns `true` when the feature has been activated at least once.
  bool get hasUsage => totalActivations > 0;

  /// Average activations per unique user.
  double get activationsPerUser =>
      uniqueUsers == 0 ? 0.0 : totalActivations / uniqueUsers;

  @override
  List<Object?> get props => [
    featureId,
    featureName,
    totalActivations,
    uniqueUsers,
    lastActivatedAt,
    isExperimental,
  ];
}
