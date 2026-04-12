import 'package:equatable/equatable.dart';

/// Compares two financial ratio values and describes the magnitude
/// of the difference between them.
class RatioComparisonResult extends Equatable {
  /// Creates a [RatioComparisonResult].
  const RatioComparisonResult({
    required this.ratioName,
    required this.tickerA,
    required this.valueA,
    required this.tickerB,
    required this.valueB,
  });

  /// Name of the ratio being compared (e.g. `'P/E'`, `'ROE'`).
  final String ratioName;

  /// Ticker for the first value.
  final String tickerA;

  /// Ratio value for [tickerA].
  final double valueA;

  /// Ticker for the second value (benchmark or peer).
  final String tickerB;

  /// Ratio value for [tickerB].
  final double valueB;

  /// Signed difference: [valueA] − [valueB].
  double get difference => valueA - valueB;

  /// Percentage difference relative to [valueB] (0 when [valueB] == 0).
  double get differencePct =>
      valueB == 0 ? 0.0 : difference / valueB.abs() * 100;

  /// Returns `true` when [tickerA] has a higher value than [tickerB].
  bool get aIsHigher => valueA > valueB;

  /// Returns `true` when the absolute percentage difference exceeds 20%.
  bool get isSignificant => differencePct.abs() > 20.0;

  @override
  List<Object?> get props => [ratioName, tickerA, valueA, tickerB, valueB];
}
