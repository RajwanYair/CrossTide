import 'package:equatable/equatable.dart';

/// 52-week and all-time price range for a single ticker.
class TickerPriceRange extends Equatable {
  const TickerPriceRange({
    required this.ticker,
    required this.currentPrice,
    required this.week52High,
    required this.week52Low,
    required this.allTimeHigh,
  });

  final String ticker;
  final double currentPrice;

  /// Highest closing price over the trailing 52 weeks.
  final double week52High;

  /// Lowest closing price over the trailing 52 weeks.
  final double week52Low;

  /// Historical all-time-high closing price.
  final double allTimeHigh;

  /// True when current price equals the all-time high.
  bool get isAtAllTimeHigh => currentPrice >= allTimeHigh;

  /// True when current price equals the 52-week high.
  bool get isAt52WeekHigh => currentPrice >= week52High;

  /// True when current price equals the 52-week low.
  bool get isAt52WeekLow => currentPrice <= week52Low;

  /// Percentage distance from the 52-week high (negative = below high).
  double get pctFrom52WeekHigh =>
      week52High != 0 ? (currentPrice - week52High) / week52High * 100 : 0;

  /// Percentage distance from the 52-week low (positive = above low).
  double get pctFrom52WeekLow =>
      week52Low != 0 ? (currentPrice - week52Low) / week52Low * 100 : 0;

  /// Percentage distance from the all-time high.
  double get pctFromAllTimeHigh =>
      allTimeHigh != 0 ? (currentPrice - allTimeHigh) / allTimeHigh * 100 : 0;

  /// Position within the 52-week range as 0.0 (at low) to 1.0 (at high).
  double get positionIn52WeekRange {
    final double span = week52High - week52Low;
    if (span == 0) return 0.5;
    return (currentPrice - week52Low) / span;
  }

  @override
  List<Object?> get props => [
    ticker,
    currentPrice,
    week52High,
    week52Low,
    allTimeHigh,
  ];
}
