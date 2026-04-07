/// Multi-Timeframe Service — application-layer orchestration.
///
/// Uses [MultiTimeframeAnalyzer] and [CandleAggregator] to produce
/// weighted confluence scores across daily, weekly, and monthly candles.
library;

import '../domain/domain.dart';

/// Orchestrates multi-timeframe analysis from raw daily candles.
class MultiTimeframeService {
  const MultiTimeframeService({
    CandleAggregator aggregator = const CandleAggregator(),
    MultiTimeframeAnalyzer analyzer = const MultiTimeframeAnalyzer(),
  }) : _aggregator = aggregator,
       _analyzer = analyzer;

  final CandleAggregator _aggregator;
  final MultiTimeframeAnalyzer _analyzer;

  /// Aggregate daily candles to weekly + monthly, then score confluence.
  MultiTimeframeResult analyze({
    required String ticker,
    required List<DailyCandle> dailyCandles,
    required List<TimeframeBias> biases,
  }) {
    return _analyzer.analyze(ticker: ticker, timeframeBiases: biases);
  }

  /// Aggregate daily candles into weekly bars.
  List<DailyCandle> toWeekly(List<DailyCandle> dailyCandles) {
    return _aggregator.toWeekly(dailyCandles);
  }

  /// Aggregate daily candles into monthly bars.
  List<DailyCandle> toMonthly(List<DailyCandle> dailyCandles) {
    return _aggregator.toMonthly(dailyCandles);
  }
}
