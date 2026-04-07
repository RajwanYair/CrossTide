import 'package:cross_tide/src/application/backtest_orchestrator.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const orchestrator = BacktestOrchestrator();
  const strategy = BacktestStrategy(
    name: 'SMA Cross',
    entryAlertTypes: {'sma200CrossUp'},
    exitAlertTypes: {'sma200CrossDown'},
  );

  final candles = List.generate(
    100,
    (int i) => DailyCandle(
      date: DateTime(2024, 1, 1).add(Duration(days: i)),
      open: 100.0 + i * 0.5,
      high: 101.0 + i * 0.5,
      low: 99.0 + i * 0.5,
      close: 100.5 + i * 0.5,
      volume: 1000000,
    ),
  );

  test('run produces a BacktestResult', () {
    final result = orchestrator.run(
      ticker: 'AAPL',
      strategy: strategy,
      candles: candles,
    );
    expect(result.ticker, 'AAPL');
    expect(result.methodName, 'SMA Cross');
  });

  test('runAll produces results for all tickers', () {
    final results = orchestrator.runAll(
      tickerCandles: {'AAPL': candles, 'MSFT': candles},
      strategy: strategy,
    );
    expect(results.length, 2);
    expect(results.containsKey('AAPL'), isTrue);
    expect(results.containsKey('MSFT'), isTrue);
  });
}
