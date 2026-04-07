/// Daily Metrics Summary — pure domain value object.
///
/// Aggregates key technical indicators and alert state for a single ticker
/// on a single day, suitable for JSON export.
library;

import 'package:equatable/equatable.dart';

/// Summary metrics for one ticker on one day.
class DailyMetrics extends Equatable {
  const DailyMetrics({
    required this.ticker,
    required this.date,
    required this.close,
    this.sma50,
    this.sma150,
    this.sma200,
    this.rsi,
    this.macdLine,
    this.macdSignal,
    this.atr,
    this.volume,
    this.avgVolume20,
    this.alertsFired = 0,
  });

  /// Ticker symbol.
  final String ticker;

  /// Trading date.
  final DateTime date;

  /// Closing price.
  final double close;

  /// SMA-50 value (null if insufficient data).
  final double? sma50;

  /// SMA-150 value (null if insufficient data).
  final double? sma150;

  /// SMA-200 value (null if insufficient data).
  final double? sma200;

  /// RSI-14 value (null if insufficient data).
  final double? rsi;

  /// MACD line value (null if insufficient data).
  final double? macdLine;

  /// MACD signal line value (null if insufficient data).
  final double? macdSignal;

  /// ATR-14 value (null if insufficient data).
  final double? atr;

  /// Trading volume for the day.
  final int? volume;

  /// 20-day average volume.
  final int? avgVolume20;

  /// Number of alerts fired on this day.
  final int alertsFired;

  /// Distance from SMA-200 as a percentage.
  /// Positive = price above SMA200; negative = below.
  double? get distanceFromSma200 =>
      sma200 != null && sma200! > 0 ? (close - sma200!) / sma200! * 100 : null;

  /// Convert to a JSON-serializable map.
  Map<String, dynamic> toJson() => {
    'ticker': ticker,
    'date': date.toIso8601String().split('T').first,
    'close': close,
    if (sma50 != null) 'sma50': sma50,
    if (sma150 != null) 'sma150': sma150,
    if (sma200 != null) 'sma200': sma200,
    if (rsi != null) 'rsi': rsi,
    if (macdLine != null) 'macdLine': macdLine,
    if (macdSignal != null) 'macdSignal': macdSignal,
    if (atr != null) 'atr': atr,
    if (volume != null) 'volume': volume,
    if (avgVolume20 != null) 'avgVolume20': avgVolume20,
    'alertsFired': alertsFired,
  };

  @override
  List<Object?> get props => [
    ticker,
    date,
    close,
    sma50,
    sma150,
    sma200,
    rsi,
    macdLine,
    macdSignal,
    atr,
    volume,
    avgVolume20,
    alertsFired,
  ];
}
