import 'package:cross_tide/src/application/forex_analysis_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = ForexAnalysisService();
  const pair = ForexPair(base: 'EUR', quote: 'USD');

  final candles = List.generate(
    20,
    (int i) => DailyCandle(
      date: DateTime(2025, 3, 1).add(Duration(days: i)),
      open: 1.08 + i * 0.001,
      high: 1.09 + i * 0.001,
      low: 1.07 + i * 0.001,
      close: 1.085 + i * 0.001,
      volume: 100000,
    ),
  );

  test('summarize returns ForexSummary', () {
    final summary = service.summarize(pair: pair, candles: candles);
    expect(summary.pair, pair);
    expect(summary.currentRate, isPositive);
  });

  test('summarizeAll returns map of summaries', () {
    final results = service.summarizeAll({pair: candles});
    expect(results.containsKey('EURUSD'), isTrue);
  });
}
