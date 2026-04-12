import 'package:equatable/equatable.dart';

/// A color stop within a heat-map gradient.
class ColorStop extends Equatable {
  const ColorStop({required this.value, required this.colorHex});

  /// Normalised value (0.0–1.0) at which this color is applied.
  final double value;

  /// ARGB hex color string (e.g. "#FF4CAF50").
  final String colorHex;

  @override
  List<Object?> get props => [value, colorHex];
}

/// A named heat-map color scale used for rendering heat-map charts.
class HeatMapColorScale extends Equatable {
  const HeatMapColorScale({
    required this.scaleId,
    required this.name,
    required this.stops,
    this.reversed = false,
  });

  final String scaleId;
  final String name;

  /// Ordered color stops from low to high value.
  final List<ColorStop> stops;

  /// `true` to reverse the gradient direction.
  final bool reversed;

  HeatMapColorScale copyWith({
    String? scaleId,
    String? name,
    List<ColorStop>? stops,
    bool? reversed,
  }) => HeatMapColorScale(
    scaleId: scaleId ?? this.scaleId,
    name: name ?? this.name,
    stops: stops ?? this.stops,
    reversed: reversed ?? this.reversed,
  );

  @override
  List<Object?> get props => [scaleId, name, stops, reversed];
}
