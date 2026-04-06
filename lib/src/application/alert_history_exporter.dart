/// AlertHistoryExporter — writes alert history to CSV or JSON.
///
/// The target file is placed in the application-documents directory so it is
/// accessible by the user even without a share-sheet dependency.
library;

import 'dart:convert';
import 'dart:io';

import 'package:intl/intl.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../domain/entities.dart';

/// Output format selector.
enum ExportFormat { csv, json }

class AlertHistoryExporter {
  static final _ts = DateFormat("yyyy-MM-dd'T'HH:mm:ss");
  static final _fileTs = DateFormat('yyyyMMdd_HHmmss');

  /// Export [entries] to a file in the app documents directory.
  ///
  /// Returns the absolute path to the created file.
  static Future<String> export(
    List<AlertHistoryEntry> entries, {
    ExportFormat format = ExportFormat.csv,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final timestamp = _fileTs.format(DateTime.now());
    final ext = format == ExportFormat.csv ? 'csv' : 'json';
    final file = File(p.join(dir.path, 'crosstide_alerts_$timestamp.$ext'));

    final content = format == ExportFormat.csv
        ? _toCsv(entries)
        : _toJson(entries);

    await file.writeAsString(content, encoding: utf8, flush: true);
    return file.path;
  }

  static String _toCsv(List<AlertHistoryEntry> entries) {
    final buf = StringBuffer();
    // Header
    buf.writeln('id,symbol,alertType,message,firedAt,acknowledged');
    for (final e in entries) {
      buf.writeln(
        [
          e.id ?? '',
          _csvEscape(e.symbol),
          _csvEscape(e.alertType),
          _csvEscape(e.message),
          _ts.format(e.firedAt.toLocal()),
          e.acknowledged ? '1' : '0',
        ].join(','),
      );
    }
    return buf.toString();
  }

  static String _toJson(List<AlertHistoryEntry> entries) {
    final list = entries
        .map(
          (e) => {
            'id': e.id,
            'symbol': e.symbol,
            'alertType': e.alertType,
            'message': e.message,
            'firedAt': _ts.format(e.firedAt.toLocal()),
            'acknowledged': e.acknowledged,
          },
        )
        .toList();
    return const JsonEncoder.withIndent('  ').convert(list);
  }

  static String _csvEscape(String s) {
    if (s.contains(',') || s.contains('"') || s.contains('\n')) {
      return '"${s.replaceAll('"', '""')}"';
    }
    return s;
  }
}
