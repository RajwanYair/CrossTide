/// Backtest Orchestrator — application-layer orchestration.
///
/// Wraps [BacktestEngine] to run backtests on multiple tickers and
/// produce aggregated performance results.
library;

import '../domain/domain.dart';

/// Orchestrates backtesting across a watchlist.
class BacktestOrchestrator {
  const BacktestOrchestrator({BacktestEngine engine = const BacktestEngine()})
    : _engine = engine;

  final BacktestEngine _engine;

  /// Run a backtest on a single ticker.
  BacktestResult run({
    required String ticker,
    required BacktestStrategy strategy,
    required List<DailyCandle> candles,
    List<String> Function(DailyCandle candle)? signalResolver,
  }) {
    return _engine.run(
      ticker: ticker,
      strategy: strategy,
      candles: candles,
      signalResolver: signalResolver,
    );
  }

  /// Run backtests across multiple tickers with the same strategy.
  Map<String, BacktestResult> runAll({
    required Map<String, List<DailyCandle>> tickerCandles,
    required BacktestStrategy strategy,
    List<String> Function(DailyCandle candle)? signalResolver,
  }) {
    final Map<String, BacktestResult> results = {};
    for (final MapEntry<String, List<DailyCandle>> entry
        in tickerCandles.entries) {
      results[entry.key] = _engine.run(
        ticker: entry.key,
        strategy: strategy,
        candles: entry.value,
        signalResolver: signalResolver,
      );
    }
    return results;
  }
}
