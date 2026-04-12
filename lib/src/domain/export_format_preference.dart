import 'package:equatable/equatable.dart';

/// Supported export file formats (S499).
enum ExportFileFormat { csv, json, pdf, xlsx, html }

/// User preference for exported data file format and options (S499).
class ExportFormatPreference extends Equatable {
  const ExportFormatPreference({
    required this.preferenceId,
    required this.userId,
    required this.preferredFormat,
    this.includeHeaders = true,
    this.compressOutput = false,
    this.dateFormat = 'yyyy-MM-dd',
  });

  final String preferenceId;
  final String userId;
  final ExportFileFormat preferredFormat;

  /// Whether column headers are included (applies to CSV/XLSX).
  final bool includeHeaders;
  final bool compressOutput;
  final String dateFormat;

  bool get isCsvOrXlsx =>
      preferredFormat == ExportFileFormat.csv ||
      preferredFormat == ExportFileFormat.xlsx;

  bool get isPdf => preferredFormat == ExportFileFormat.pdf;

  @override
  List<Object?> get props => [
    preferenceId,
    userId,
    preferredFormat,
    includeHeaders,
    compressOutput,
    dateFormat,
  ];
}
