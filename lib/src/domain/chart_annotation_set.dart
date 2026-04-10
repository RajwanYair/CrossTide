import 'package:equatable/equatable.dart';

/// Type of annotation drawn on a chart.
enum ChartAnnotationType {
  horizontalLine,
  verticalLine,
  trendLine,
  rectangle,
  arrow,
  textLabel,
  fibonacciRetracement,
}

/// A single annotation on a chart.
class ChartAnnotationEntry extends Equatable {
  const ChartAnnotationEntry({
    required this.annotationId,
    required this.annotationType,
    required this.colorHex,
    required this.createdAt,
    this.label,
    this.x1,
    this.y1,
    this.x2,
    this.y2,
  });

  final String annotationId;
  final ChartAnnotationType annotationType;

  /// Hex colour string (e.g. '#FF5733').
  final String colorHex;

  final DateTime createdAt;

  /// Optional display label.
  final String? label;

  /// Coordinates (bar index / price) for the annotation.
  final double? x1;
  final double? y1;
  final double? x2;
  final double? y2;

  bool get hasLabel => label != null && label!.isNotEmpty;

  @override
  List<Object?> get props => [
    annotationId,
    annotationType,
    colorHex,
    createdAt,
    label,
    x1,
    y1,
    x2,
    y2,
  ];
}

/// A named set of chart annotations for a ticker.
class ChartAnnotationSet extends Equatable {
  const ChartAnnotationSet({
    required this.setId,
    required this.ticker,
    required this.annotations,
    required this.updatedAt,
  });

  final String setId;
  final String ticker;
  final List<ChartAnnotationEntry> annotations;
  final DateTime updatedAt;

  int get count => annotations.length;

  /// Returns all annotations of the given type.
  List<ChartAnnotationEntry> ofType(ChartAnnotationType type) =>
      annotations.where((a) => a.annotationType == type).toList();

  @override
  List<Object?> get props => [setId, ticker, annotations, updatedAt];
}
