/// Data Export Formatter — formats candle/alert data for CSV, JSON,
/// or plain-text export from the repository.
library;

import '../domain/entities.dart';

/// Supported export formats.
enum ExportFormat { csv, json, plainText }

/// Formats data for export.
class DataExportFormatter {
  const DataExportFormatter();

  /// Format candles as CSV.
  String candlesToCsv(List<DailyCandle> candles) {
    final buffer = StringBuffer('Date,Open,High,Low,Close,Volume\n');
    for (final DailyCandle c in candles) {
      buffer.writeln(
        '${_formatDate(c.date)},${c.open},${c.high},${c.low},${c.close},${c.volume}',
      );
    }
    return buffer.toString();
  }

  /// Format candles as JSON array string.
  String candlesToJson(List<DailyCandle> candles) {
    final buffer = StringBuffer('[\n');
    for (int i = 0; i < candles.length; i++) {
      final DailyCandle c = candles[i];
      buffer.write(
        '  {"date":"${_formatDate(c.date)}",'
        '"open":${c.open},'
        '"high":${c.high},'
        '"low":${c.low},'
        '"close":${c.close},'
        '"volume":${c.volume}}',
      );
      if (i < candles.length - 1) buffer.write(',');
      buffer.writeln();
    }
    buffer.write(']');
    return buffer.toString();
  }

  /// Format candles as readable plain text.
  String candlesToPlainText(List<DailyCandle> candles) {
    final buffer = StringBuffer();
    for (final DailyCandle c in candles) {
      buffer.writeln(
        '${_formatDate(c.date)}: O=${c.open} H=${c.high} L=${c.low} C=${c.close} V=${c.volume}',
      );
    }
    return buffer.toString();
  }

  /// Format candles in the specified format.
  String formatCandles(List<DailyCandle> candles, ExportFormat format) {
    switch (format) {
      case ExportFormat.csv:
        return candlesToCsv(candles);
      case ExportFormat.json:
        return candlesToJson(candles);
      case ExportFormat.plainText:
        return candlesToPlainText(candles);
    }
  }

  String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
