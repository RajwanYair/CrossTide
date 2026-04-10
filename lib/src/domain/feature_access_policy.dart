import 'package:equatable/equatable.dart';

/// Feature access scope for a policy entry.
enum FeatureAccessScope {
  /// Available to all users regardless of tier.
  free,

  /// Available to subscription tier users.
  subscriber,

  /// Available to premium tier users only.
  premium,

  /// Administrative / internal users only.
  admin,

  /// Controlled by a feature flag.
  flagGated,
}

/// Policy controlling access to a named feature.
class FeatureAccessPolicy extends Equatable {
  const FeatureAccessPolicy({
    required this.featureKey,
    required this.scope,
    this.minimumTierName,
    this.requiredFlagKey,
    this.isEnabled = true,
  });

  final String featureKey;
  final FeatureAccessScope scope;

  /// Minimum subscription tier name when scope is subscriber/premium.
  final String? minimumTierName;

  /// Feature flag key required when scope is flagGated.
  final String? requiredFlagKey;

  final bool isEnabled;

  /// Returns true when feature is freely accessible without any gate.
  bool get isFree => scope == FeatureAccessScope.free && isEnabled;

  /// Returns true when feature requires a flag to be toggled on.
  bool get isFlagGated => scope == FeatureAccessScope.flagGated;

  @override
  List<Object?> get props => [
    featureKey,
    scope,
    minimumTierName,
    requiredFlagKey,
    isEnabled,
  ];
}
