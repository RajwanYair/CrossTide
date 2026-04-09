/// Portfolio Optimizer — mean-variance efficient weight calculation.
library;

import 'dart:math';

import 'package:equatable/equatable.dart';

/// Optimisation objective.
enum OptimizationObjective {
  /// Maximise the Sharpe ratio (return / risk).
  maxSharpe,

  /// Minimise portfolio volatility.
  minVolatility,

  /// Equal-weight baseline (no optimisation).
  equalWeight,

  /// Risk-parity: each asset contributes equally to total risk.
  riskParity,
}

/// Optimal weight for one asset.
class AssetWeight extends Equatable {
  const AssetWeight({
    required this.ticker,
    required this.weight,
  }) : assert(weight >= 0.0 && weight <= 1.0, 'weight must be 0–1');

  final String ticker;

  /// Portfolio weight (0.0–1.0).
  final double weight;

  @override
  List<Object?> get props => [ticker, weight];
}

/// Result of a portfolio optimisation run.
class OptimizationResult extends Equatable {
  const OptimizationResult({
    required this.objective,
    required this.weights,
    required this.expectedReturn,
    required this.expectedVolatility,
    required this.sharpeRatio,
  });

  final OptimizationObjective objective;
  final List<AssetWeight> weights;

  /// Annualised expected portfolio return (fraction, e.g. 0.12 = 12%).
  final double expectedReturn;

  /// Annualised expected portfolio volatility (fraction).
  final double expectedVolatility;

  /// Sharpe ratio using a 0% risk-free rate.
  final double sharpeRatio;

  @override
  List<Object?> get props => [
        objective,
        weights,
        expectedReturn,
        expectedVolatility,
        sharpeRatio,
      ];
}

/// Computes optimal portfolio weights from historical returns.
///
/// This implementation uses a simplified gradient-free grid-search
/// approach suitable for small portfolios (≤20 assets).  For production
/// use, wire in a quadratic-programming solver via a data-layer adapter.
class PortfolioOptimizer {
  const PortfolioOptimizer({
    this.annualizationFactor = 252,
    this.riskFreeRate = 0.0,
    this.iterations = 5000,
  });

  /// Trading days per year used for annualisation.
  final int annualizationFactor;

  final double riskFreeRate;

  /// Monte-Carlo iterations for [OptimizationObjective.maxSharpe] and
  /// [OptimizationObjective.minVolatility].
  final int iterations;

  /// Compute optimal weights for [tickers] from a matrix of daily returns.
  ///
  /// [returns] must be indexed as `returns[assetIndex][dayIndex]`.
  OptimizationResult? optimize({
    required List<String> tickers,
    required List<List<double>> returns,
    required OptimizationObjective objective,
  }) {
    final n = tickers.length;
    if (n < 2 || returns.length != n) return null;
    final minDays = returns.fold<int>(
        9999, (prev, r) => r.length < prev ? r.length : prev);
    if (minDays < 2) return null;

    switch (objective) {
      case OptimizationObjective.equalWeight:
        return _equalWeight(tickers, returns);
      case OptimizationObjective.minVolatility:
        return _monteCarlo(
            tickers, returns, OptimizationObjective.minVolatility);
      case OptimizationObjective.maxSharpe:
        return _monteCarlo(tickers, returns, OptimizationObjective.maxSharpe);
      case OptimizationObjective.riskParity:
        return _riskParity(tickers, returns);
    }
  }

  OptimizationResult _equalWeight(
    List<String> tickers,
    List<List<double>> returns,
  ) {
    final n = tickers.length;
    final w = List<double>.filled(n, 1.0 / n);
    final (ret, vol) = _portfolioStats(w, returns);
    return _buildResult(
        OptimizationObjective.equalWeight, tickers, w, ret, vol);
  }

  OptimizationResult _monteCarlo(
    List<String> tickers,
    List<List<double>> returns,
    OptimizationObjective obj,
  ) {
    final n = tickers.length;
    final rng = Random();
    var bestWeights = List<double>.filled(n, 1.0 / n);
    var (bestRet, bestVol) = _portfolioStats(bestWeights, returns);
    var bestScore = obj == OptimizationObjective.maxSharpe
        ? (bestVol > 0 ? (bestRet - riskFreeRate) / bestVol : 0.0)
        : -bestVol;

    for (var i = 0; i < iterations; i++) {
      final raw = List<double>.generate(n, (_) => rng.nextDouble());
      final sum = raw.fold<double>(0, (a, v) => a + v);
      final w = raw.map((v) => v / sum).toList();
      final (ret, vol) = _portfolioStats(w, returns);
      final score = obj == OptimizationObjective.maxSharpe
          ? (vol > 0 ? (ret - riskFreeRate) / vol : 0.0)
          : -vol;
      if (score > bestScore) {
        bestScore = score;
        bestWeights = w;
        bestRet = ret;
        bestVol = vol;
      }
    }
    return _buildResult(obj, tickers, bestWeights, bestRet, bestVol);
  }

  OptimizationResult _riskParity(
    List<String> tickers,
    List<List<double>> returns,
  ) {
    // Inverse-volatility weighting (simplified risk parity)
    final vols = returns.map(_sampleStdDev).toList();
    final invVols = vols.map((v) => v > 0 ? 1.0 / v : 0.0).toList();
    final sumInv = invVols.fold<double>(0, (a, v) => a + v);
    final w = sumInv > 0
        ? invVols.map((v) => v / sumInv).toList()
        : List<double>.filled(tickers.length, 1.0 / tickers.length);
    final (ret, vol) = _portfolioStats(w, returns);
    return _buildResult(OptimizationObjective.riskParity, tickers, w, ret, vol);
  }

  (double, double) _portfolioStats(
    List<double> weights,
    List<List<double>> returns,
  ) {
    final n = weights.length;
    final days =
        returns.fold<int>(9999, (p, r) => r.length < p ? r.length : p);

    // Portfolio daily returns
    final portReturns = List<double>.generate(days, (d) {
      var s = 0.0;
      for (var i = 0; i < n; i++) {
        s += weights[i] * returns[i][d];
      }
      return s;
    });

    final mean = portReturns.fold<double>(0, (a, v) => a + v) / days;
    final annRet = mean * annualizationFactor;
    final annVol = _sampleStdDev(portReturns) * sqrt(annualizationFactor.toDouble());
    return (annRet, annVol);
  }

  double _sampleStdDev(List<double> vals) {
    if (vals.length < 2) return 0.0;
    final mean = vals.fold<double>(0, (a, v) => a + v) / vals.length;
    final variance =
        vals.fold<double>(0, (a, v) => a + (v - mean) * (v - mean)) /
            (vals.length - 1);
    return sqrt(variance);
  }

  OptimizationResult _buildResult(
    OptimizationObjective obj,
    List<String> tickers,
    List<double> weights,
    double ret,
    double vol,
  ) {
    final sharpe = vol > 0 ? (ret - riskFreeRate) / vol : 0.0;
    return OptimizationResult(
      objective: obj,
      weights: [
        for (var i = 0; i < tickers.length; i++)
          AssetWeight(ticker: tickers[i], weight: weights[i]),
      ],
      expectedReturn: ret,
      expectedVolatility: vol,
      sharpeRatio: sharpe,
    );
  }
}
