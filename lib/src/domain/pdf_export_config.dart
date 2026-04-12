import 'package:equatable/equatable.dart';

/// PDF export orientation (S497).
enum PdfPageOrientation { portrait, landscape }

/// Configuration for a PDF export operation (S497).
class PdfExportConfig extends Equatable {
  const PdfExportConfig({
    required this.configId,
    required this.title,
    required this.orientation,
    required this.includeSections,
    this.includeCharts = true,
    this.watermarkText = '',
    this.pageCount = 1,
  });

  final String configId;
  final String title;
  final PdfPageOrientation orientation;

  /// List of section identifiers to include in the export.
  final List<String> includeSections;
  final bool includeCharts;

  /// Optional watermark text printed on each page.
  final String watermarkText;
  final int pageCount;

  bool get isLandscape => orientation == PdfPageOrientation.landscape;
  bool get hasWatermark => watermarkText.isNotEmpty;
  bool get isMultiPage => pageCount > 1;

  @override
  List<Object?> get props => [
    configId,
    title,
    orientation,
    includeSections,
    includeCharts,
    watermarkText,
    pageCount,
  ];
}
