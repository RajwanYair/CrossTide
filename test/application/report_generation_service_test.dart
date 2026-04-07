import 'package:cross_tide/src/application/report_generation_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = ReportGenerationService();

  final candles = List.generate(
    250,
    (int i) => DailyCandle(
      date: DateTime(2024, 1, 1).add(Duration(days: i)),
      open: 150.0 + i * 0.1,
      high: 151.0 + i * 0.1,
      low: 149.0 + i * 0.1,
      close: 150.5 + i * 0.1,
      volume: 5000000,
    ),
  );

  test('generate builds a report with sections', () {
    final report = service.generate(ticker: 'AAPL', candles: candles);
    expect(report.ticker, 'AAPL');
    expect(report.sections, isNotEmpty);
    expect(report.metadata.candleCount, 250);
    expect(report.metadata.providerName, 'Yahoo Finance');
  });

  test('generate handles empty candles', () {
    final report = service.generate(ticker: 'AAPL', candles: []);
    expect(report.ticker, 'AAPL');
    expect(report.metadata.candleCount, 0);
  });
}
