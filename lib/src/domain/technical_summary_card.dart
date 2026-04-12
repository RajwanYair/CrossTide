import 'package:equatable/equatable.dart';

/// A compact technical summary card for a ticker.
///
/// Aggregates the most important technical signals into a single object
/// suitable for display in list views or quick-scan screens.
class TechnicalSummaryCard extends Equatable {
  /// Creates a [TechnicalSummaryCard].
  const TechnicalSummaryCard({
    required this.ticker,
    required this.close,
    required this.sma50,
    required this.sma200,
    required this.rsi14,
    required this.macdLine,
    required this.macdSignal,
    required this.updatedAt,
  });

  /// Ticker symbol.
  final String ticker;

  /// Most recent close price.
  final double close;

  /// 50-day simple moving average.
  final double sma50;

  /// 200-day simple moving average.
  final double sma200;

  /// 14-period RSI value.
  final double rsi14;

  /// MACD line value.
  final double macdLine;

  /// MACD signal line value.
  final double macdSignal;

  /// Timestamp of the snapshot.
  final DateTime updatedAt;

  /// Returns `true` when price is above SMA50 and SMA200.
  bool get isAboveBothMas => close > sma50 && close > sma200;

  /// Returns `true` when the golden cross condition holds (SMA50 > SMA200).
  bool get isGoldenCross => sma50 > sma200;

  /// Returns `true` when MACD is bullish (macdLine > macdSignal).
  bool get isMacdBullish => macdLine > macdSignal;

  /// Returns `true` when RSI is in the oversold zone.
  bool get isOversold => rsi14 < 30;

  /// Returns `true` when RSI is in the overbought zone.
  bool get isOverbought => rsi14 > 70;

  @override
  List<Object?> get props => [
    ticker,
    close,
    sma50,
    sma200,
    rsi14,
    macdLine,
    macdSignal,
    updatedAt,
  ];
}
