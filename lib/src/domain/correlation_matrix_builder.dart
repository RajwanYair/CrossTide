/// Correlation Matrix Builder — computes pairwise Pearson correlation
/// for a set of tickers and identifies highly correlated/inversely
/// correlated pairs.
library;

import 'package:equatable/equatable.dart';

/// A pairwise correlation between two tickers.
class PairCorrelation extends Equatable {
  const PairCorrelation({
    required this.tickerA,
    required this.tickerB,
    required this.correlation,
  });

  final String tickerA;
  final String tickerB;

  /// Pearson correlation coefficient (−1 to +1).
  final double correlation;

  /// Whether the pair is highly correlated (|r| > 0.8).
  bool get isHighlyCorrelated => correlation.abs() > 0.8;

  /// Whether the pair is inversely correlated (r < −0.5).
  bool get isInverselyCorrelated => correlation < -0.5;

  @override
  List<Object?> get props => [tickerA, tickerB, correlation];
}

/// Full correlation matrix result.
class CorrelationMatrixResult extends Equatable {
  const CorrelationMatrixResult({required this.pairs, required this.tickers});

  final List<PairCorrelation> pairs;
  final List<String> tickers;

  /// Pairs with |correlation| > threshold.
  List<PairCorrelation> highlyCorrelated({double threshold = 0.8}) => pairs
      .where((PairCorrelation p) => p.correlation.abs() > threshold)
      .toList();

  /// Lookup correlation between two tickers.
  double? lookup(String a, String b) {
    for (final PairCorrelation p in pairs) {
      if ((p.tickerA == a && p.tickerB == b) ||
          (p.tickerA == b && p.tickerB == a)) {
        return p.correlation;
      }
    }
    return null;
  }

  @override
  List<Object?> get props => [pairs, tickers];
}

/// Builds a pairwise correlation matrix from return series.
class CorrelationMatrixBuilder {
  const CorrelationMatrixBuilder();

  /// Compute pairwise correlations.
  ///
  /// [returnSeries] maps ticker → list of periodic returns.
  /// All return lists should have the same length for accurate results.
  CorrelationMatrixResult build(Map<String, List<double>> returnSeries) {
    final tickers = returnSeries.keys.toList()..sort();
    final pairs = <PairCorrelation>[];

    for (int i = 0; i < tickers.length; i++) {
      for (int j = i + 1; j < tickers.length; j++) {
        final a = returnSeries[tickers[i]]!;
        final b = returnSeries[tickers[j]]!;
        final corr = _pearson(a, b);
        pairs.add(
          PairCorrelation(
            tickerA: tickers[i],
            tickerB: tickers[j],
            correlation: corr,
          ),
        );
      }
    }

    return CorrelationMatrixResult(pairs: pairs, tickers: tickers);
  }

  double _pearson(List<double> x, List<double> y) {
    final n = x.length < y.length ? x.length : y.length;
    if (n < 2) return 0;

    var sumX = 0.0;
    var sumY = 0.0;
    var sumXY = 0.0;
    var sumX2 = 0.0;
    var sumY2 = 0.0;

    for (int i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }

    final numerator = n * sumXY - sumX * sumY;
    final denomA = n * sumX2 - sumX * sumX;
    final denomB = n * sumY2 - sumY * sumY;
    final denom = _sqrt(denomA * denomB);

    if (denom == 0) return 0;
    return numerator / denom;
  }

  double _sqrt(double x) {
    if (x <= 0) return 0;
    var guess = x / 2;
    for (int i = 0; i < 50; i++) {
      final next = (guess + x / guess) / 2;
      if ((next - guess).abs() < 1e-10) break;
      guess = next;
    }
    return guess;
  }
}
