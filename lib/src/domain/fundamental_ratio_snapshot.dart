import 'package:equatable/equatable.dart';

/// A snapshot of key fundamental ratios for a single ticker.
class FundamentalRatioSnapshot extends Equatable {
  /// Creates a [FundamentalRatioSnapshot].
  const FundamentalRatioSnapshot({
    required this.ticker,
    required this.capturedAt,
    required this.peRatio,
    required this.pbRatio,
    required this.psRatio,
    required this.evEbitda,
    required this.debtToEquity,
  });

  /// Ticker symbol.
  final String ticker;

  /// Timestamp of the snapshot.
  final DateTime capturedAt;

  /// Price-to-Earnings ratio.
  final double peRatio;

  /// Price-to-Book ratio.
  final double pbRatio;

  /// Price-to-Sales ratio.
  final double psRatio;

  /// Enterprise Value to EBITDA multiple.
  final double evEbitda;

  /// Debt-to-Equity ratio.
  final double debtToEquity;

  /// Returns `true` when the stock looks undervalued by traditional measures.
  bool get isValueStock => peRatio < 15.0 && pbRatio < 2.0;

  /// Returns `true` when leverage is high (D/E > 2.0).
  bool get isHighLeverage => debtToEquity > 2.0;

  /// Returns `true` when the EV/EBITDA suggests premium valuation (> 20×).
  bool get isPremiumValuation => evEbitda > 20.0;

  @override
  List<Object?> get props => [
    ticker,
    capturedAt,
    peRatio,
    pbRatio,
    psRatio,
    evEbitda,
    debtToEquity,
  ];
}
