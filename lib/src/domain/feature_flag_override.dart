import 'package:equatable/equatable.dart';

/// A runtime override for an individual feature flag, taking precedence
/// over the remote config and default values.
class FeatureFlagOverride extends Equatable {
  const FeatureFlagOverride({
    required this.flagKey,
    required this.overrideValue,
    required this.overriddenBy,
    required this.createdAt,
    this.expiresAt,
    this.reason,
  });

  final String flagKey;

  /// The overridden boolean, numeric, or string value.
  final Object overrideValue;

  /// Who applied this override ("developer", "qa", "ops").
  final String overriddenBy;

  final DateTime createdAt;

  /// Null means the override never expires.
  final DateTime? expiresAt;

  final String? reason;

  FeatureFlagOverride copyWith({
    String? flagKey,
    Object? overrideValue,
    String? overriddenBy,
    DateTime? createdAt,
    DateTime? expiresAt,
    String? reason,
  }) => FeatureFlagOverride(
    flagKey: flagKey ?? this.flagKey,
    overrideValue: overrideValue ?? this.overrideValue,
    overriddenBy: overriddenBy ?? this.overriddenBy,
    createdAt: createdAt ?? this.createdAt,
    expiresAt: expiresAt ?? this.expiresAt,
    reason: reason ?? this.reason,
  );

  @override
  List<Object?> get props => [
    flagKey,
    overrideValue,
    overriddenBy,
    createdAt,
    expiresAt,
    reason,
  ];
}
