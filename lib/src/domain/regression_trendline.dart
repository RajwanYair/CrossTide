import 'package:equatable/equatable.dart';

/// Direction of a linear regression trendline.
enum TrendlineDirection { up, down, flat }

/// Linear regression trendline fitted to a price series.
///
/// The line is expressed as: price = slope * bar + intercept
/// where bar is 0-indexed from [startIndex].
class RegressionTrendline extends Equatable {
  const RegressionTrendline({
    required this.ticker,
    required this.slope,
    required this.intercept,
    required this.rSquared,
    required this.startIndex,
    required this.endIndex,
    required this.period,
  });

  final String ticker;

  /// Price change per bar (positive = upward slope).
  final double slope;

  /// Y-intercept value at bar index [startIndex].
  final double intercept;

  /// Coefficient of determination (0.0–1.0). Higher = better fit.
  final double rSquared;

  final int startIndex;
  final int endIndex;

  /// Number of bars used in the regression.
  final int period;

  /// Direction classification of this trendline.
  TrendlineDirection get direction {
    if (slope > 0.01) return TrendlineDirection.up;
    if (slope < -0.01) return TrendlineDirection.down;
    return TrendlineDirection.flat;
  }

  /// True when the regression explains ≥ 70 % of price variance.
  bool get isHighConfidence => rSquared >= 0.7;

  /// Predicted price at the given bar index.
  double priceAt(int barIndex) => slope * (barIndex - startIndex) + intercept;

  @override
  List<Object?> get props => [
    ticker,
    slope,
    intercept,
    rSquared,
    startIndex,
    endIndex,
    period,
  ];
}
