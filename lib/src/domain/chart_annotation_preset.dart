import 'package:equatable/equatable.dart';

/// Visual annotation type added by the user on a price chart.
enum AnnotationPresetType {
  /// Horizontal support or resistance line.
  horizontalLine,

  /// Trend line with a defined slope.
  trendLine,

  /// Text label pinned at a specific candle.
  textLabel,

  /// Rectangle region highlighting a price/time range.
  rectangle,

  /// Arrow pointing to a notable event.
  arrow,
}

/// A saved chart annotation preset that can be reapplied across charts.
class ChartAnnotationPreset extends Equatable {
  /// Creates a [ChartAnnotationPreset].
  const ChartAnnotationPreset({
    required this.presetId,
    required this.name,
    required this.type,
    required this.colorHex,
    required this.lineWidthPx,
    this.isDashed = false,
  });

  /// Unique identifier.
  final String presetId;

  /// User-assigned name for the preset.
  final String name;

  /// Annotation type.
  final AnnotationPresetType type;

  /// Color in 6-digit hex sans-hash (e.g. `'FF4444'`).
  final String colorHex;

  /// Line or stroke width in pixels.
  final double lineWidthPx;

  /// Whether the line is rendered dashed.
  final bool isDashed;

  /// Returns `true` when the preset is a line-based type.
  bool get isLine =>
      type == AnnotationPresetType.horizontalLine ||
      type == AnnotationPresetType.trendLine;

  /// Returns `true` when the stroke is thick (≥ 2px).
  bool get isThickLine => lineWidthPx >= 2.0;

  @override
  List<Object?> get props => [
    presetId,
    name,
    type,
    colorHex,
    lineWidthPx,
    isDashed,
  ];
}
