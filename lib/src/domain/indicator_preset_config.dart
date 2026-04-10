import 'package:equatable/equatable.dart';

/// A named preset configuration for a technical indicator.
class IndicatorPresetConfig extends Equatable {
  const IndicatorPresetConfig({
    required this.presetId,
    required this.indicatorKey,
    required this.displayName,
    required this.parameters,
    this.isDefault = false,
    this.description,
  });

  final String presetId;

  /// Key identifying the indicator type (e.g. 'rsi', 'macd', 'bb').
  final String indicatorKey;
  final String displayName;

  /// Named parameter values for this preset (e.g. {'period': '14'}).
  final Map<String, String> parameters;

  /// Whether this preset is the indicator's default configuration.
  final bool isDefault;

  final String? description;

  /// Returns the value of a named parameter, or null if absent.
  String? parameter(String key) => parameters[key];

  @override
  List<Object?> get props => [
    presetId,
    indicatorKey,
    displayName,
    parameters,
    isDefault,
    description,
  ];
}
