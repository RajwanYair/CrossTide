import 'package:cross_tide/src/data/data_export_formatter.dart';
import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const formatter = DataExportFormatter();

  final candles = [
    DailyCandle(
      date: DateTime(2024, 1, 15),
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      volume: 5000,
    ),
    DailyCandle(
      date: DateTime(2024, 1, 16),
      open: 102,
      high: 108,
      low: 101,
      close: 107,
      volume: 6000,
    ),
  ];

  group('DataExportFormatter', () {
    test('CSV format has header and rows', () {
      final csv = formatter.candlesToCsv(candles);
      expect(csv, startsWith('Date,Open,High,Low,Close,Volume'));
      expect(csv, contains('2024-01-15'));
      expect(csv, contains(',100.0,'));
    });

    test('JSON format is valid structure', () {
      final json = formatter.candlesToJson(candles);
      expect(json, startsWith('['));
      expect(json, contains('"date":"2024-01-15"'));
      expect(json, contains('"close":'));
    });

    test('plain text format is readable', () {
      final text = formatter.candlesToPlainText(candles);
      expect(text, contains('2024-01-15:'));
      expect(text, contains('O='));
      expect(text, contains('C='));
    });

    test('formatCandles dispatches to correct format', () {
      final csv = formatter.formatCandles(candles, ExportFormat.csv);
      expect(csv, contains('Date,Open'));

      final json = formatter.formatCandles(candles, ExportFormat.json);
      expect(json, startsWith('['));

      final text = formatter.formatCandles(candles, ExportFormat.plainText);
      expect(text, contains('O='));
    });

    test('empty candles produce minimal output', () {
      final csv = formatter.candlesToCsv([]);
      expect(csv, contains('Date,Open'));
    });
  });
}
