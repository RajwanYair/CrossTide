/// Report Generation Service — application-layer orchestration.
///
/// Uses [ReportBuilder] to produce per-ticker [TickerReport] objects
/// from live candle data and indicator results.
library;

import '../domain/domain.dart';

/// Orchestrates report generation for one or more tickers.
class ReportGenerationService {
  const ReportGenerationService({
    ReportBuilder builder = const ReportBuilder(),
    SmaCalculator smaCalculator = const SmaCalculator(),
    RsiCalculator rsiCalculator = const RsiCalculator(),
  }) : _builder = builder,
       _smaCalculator = smaCalculator,
       _rsiCalculator = rsiCalculator;

  final ReportBuilder _builder;
  final SmaCalculator _smaCalculator;
  final RsiCalculator _rsiCalculator;

  /// Generate a ticker report from candle data.
  TickerReport generate({
    required String ticker,
    required List<DailyCandle> candles,
    String providerName = 'Yahoo Finance',
  }) {
    final technicalIndicators = <String, String>{};
    final signalHistory = <String, String>{};
    final riskMetrics = <String, String>{};

    // Price data
    if (candles.isNotEmpty) {
      final DailyCandle latest = candles.last;
      technicalIndicators['Close'] = latest.close.toStringAsFixed(2);
      technicalIndicators['High'] = latest.high.toStringAsFixed(2);
      technicalIndicators['Low'] = latest.low.toStringAsFixed(2);
      technicalIndicators['Volume'] = latest.volume.toString();
    }

    // SMA indicators
    final double? sma50 = _lastSma(candles, 50);
    final double? sma200 = _lastSma(candles, 200);
    if (sma50 != null) {
      technicalIndicators['SMA50'] = sma50.toStringAsFixed(2);
    }
    if (sma200 != null) {
      technicalIndicators['SMA200'] = sma200.toStringAsFixed(2);
    }

    // RSI
    final double? rsi = _rsiCalculator.compute(candles);
    if (rsi != null) {
      final String zone = rsi < 30
          ? 'Oversold'
          : rsi > 70
          ? 'Overbought'
          : 'Neutral';
      technicalIndicators['RSI(14)'] = '${rsi.toStringAsFixed(1)} ($zone)';
    }

    // Risk metrics
    if (candles.isNotEmpty && sma200 != null) {
      final double distPct = ((candles.last.close - sma200) / sma200) * 100;
      riskMetrics['Distance from SMA200'] = '${distPct.toStringAsFixed(1)}%';
    }

    final ReportMetadata metadata = ReportMetadata(
      dataRange: candles.isNotEmpty
          ? '${candles.first.date.toIso8601String().substring(0, 10)}'
                ' – ${candles.last.date.toIso8601String().substring(0, 10)}'
          : '',
      candleCount: candles.length,
      providerName: providerName,
    );

    return _builder.build(
      ticker: ticker,
      generatedAt: DateTime.now(),
      technicalIndicators: technicalIndicators,
      signalHistory: signalHistory,
      riskMetrics: riskMetrics,
      metadata: metadata,
    );
  }

  double? _lastSma(List<DailyCandle> candles, int period) {
    final series = _smaCalculator.computeSeries(candles, period: period);
    for (int i = series.length - 1; i >= 0; i--) {
      final (_, double? value) = series[i];
      if (value != null) return value;
    }
    return null;
  }
}
