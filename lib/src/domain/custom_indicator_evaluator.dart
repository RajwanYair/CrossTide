/// Custom Indicator Evaluator — computes SMA/EMA for user-defined periods.
///
/// Given a [CustomIndicatorConfig] and a list of [DailyCandle]s, delegates
/// to [SmaCalculator] or [EmaCalculator] and optionally detects price
/// cross-ups against the computed indicator line.
library;

import 'package:equatable/equatable.dart';

import 'custom_indicator_config.dart';
import 'ema_calculator.dart';
import 'entities.dart';
import 'sma_calculator.dart';

/// Result of evaluating a custom indicator against candle data.
class CustomIndicatorResult extends Equatable {
  const CustomIndicatorResult({
    required this.config,
    required this.series,
    this.crossUp = false,
    this.crossDown = false,
  });

  /// The config that produced this result.
  final CustomIndicatorConfig config;

  /// The computed indicator series aligned with candles:
  /// `(date, value)` where value is null when insufficient lookback.
  final List<(DateTime, double?)> series;

  /// `true` when the latest candle crossed above the indicator line.
  final bool crossUp;

  /// `true` when the latest candle crossed below the indicator line.
  final bool crossDown;

  /// The most recent non-null indicator value, or null if no data.
  double? get latestValue {
    for (int i = series.length - 1; i >= 0; i--) {
      final (DateTime _, double? v) = series[i];
      if (v != null) return v;
    }
    return null;
  }

  @override
  List<Object?> get props => [config, series, crossUp, crossDown];
}

/// Evaluates a [CustomIndicatorConfig] against candle data.
///
/// Pure domain logic — depends only on [SmaCalculator] and [EmaCalculator].
class CustomIndicatorEvaluator {
  const CustomIndicatorEvaluator({
    SmaCalculator smaCalculator = const SmaCalculator(),
    EmaCalculator emaCalculator = const EmaCalculator(),
  }) : _smaCalculator = smaCalculator,
       _emaCalculator = emaCalculator;

  final SmaCalculator _smaCalculator;
  final EmaCalculator _emaCalculator;

  /// Compute the indicator series and detect cross-up/cross-down events.
  ///
  /// Returns null when [config] is invalid or [candles] has fewer than
  /// 2 entries.
  CustomIndicatorResult? evaluate({
    required CustomIndicatorConfig config,
    required List<DailyCandle> candles,
  }) {
    if (!config.isValid || candles.length < 2) return null;

    final List<(DateTime, double?)> series;

    switch (config.type) {
      case IndicatorType.sma:
        series = _smaCalculator.computeSeries(candles, period: config.period);
      case IndicatorType.ema:
        series = _emaCalculator.computeSeries(candles, period: config.period);
    }

    if (series.length < 2) {
      return CustomIndicatorResult(config: config, series: series);
    }

    final (DateTime _, double? prevIndicator) = series[series.length - 2];
    final (DateTime _, double? currIndicator) = series[series.length - 1];

    if (prevIndicator == null || currIndicator == null) {
      return CustomIndicatorResult(config: config, series: series);
    }

    final double prevClose = candles[candles.length - 2].close;
    final double currClose = candles.last.close;

    final bool crossUp =
        config.alertOnCrossover &&
        prevClose <= prevIndicator &&
        currClose > currIndicator;

    final bool crossDown =
        config.alertOnCrossover &&
        prevClose >= prevIndicator &&
        currClose < currIndicator;

    return CustomIndicatorResult(
      config: config,
      series: series,
      crossUp: crossUp,
      crossDown: crossDown,
    );
  }
}
