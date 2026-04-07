/// Risk Parity Calculator — computes equal-risk portfolio weights
/// so each asset contributes equally to total portfolio volatility.
library;

import 'package:equatable/equatable.dart';

/// Per-asset weight from risk parity allocation.
class RiskParityWeight extends Equatable {
  const RiskParityWeight({
    required this.ticker,
    required this.weight,
    required this.volatility,
    required this.riskContribution,
  });

  final String ticker;

  /// Allocation weight (0–1, sums to 1 across all assets).
  final double weight;

  /// Annualized volatility of this asset.
  final double volatility;

  /// Fraction of total portfolio risk contributed.
  final double riskContribution;

  @override
  List<Object?> get props => [ticker, weight, volatility, riskContribution];
}

/// Result of risk parity calculation.
class RiskParityResult extends Equatable {
  const RiskParityResult({
    required this.weights,
    required this.portfolioVolatility,
  });

  final List<RiskParityWeight> weights;

  /// Estimated portfolio volatility under risk parity weighting.
  final double portfolioVolatility;

  @override
  List<Object?> get props => [weights, portfolioVolatility];
}

/// Computes risk parity weights from asset volatilities.
class RiskParityCalculator {
  const RiskParityCalculator();

  /// Compute risk parity weights.
  ///
  /// [assetVolatilities] maps ticker → annualized std dev.
  /// Uses inverse-volatility weighting as a simple risk parity approximation.
  RiskParityResult compute(Map<String, double> assetVolatilities) {
    if (assetVolatilities.isEmpty) {
      return const RiskParityResult(weights: [], portfolioVolatility: 0);
    }

    // Inverse-vol weighting: w_i = (1/σ_i) / Σ(1/σ_j)
    var sumInverse = 0.0;
    final inverses = <String, double>{};
    for (final MapEntry<String, double> entry in assetVolatilities.entries) {
      final vol = entry.value;
      if (vol <= 0) continue;
      final inv = 1.0 / vol;
      inverses[entry.key] = inv;
      sumInverse += inv;
    }

    if (sumInverse == 0) {
      return const RiskParityResult(weights: [], portfolioVolatility: 0);
    }

    final results = <RiskParityWeight>[];
    var portfolioVar = 0.0;

    for (final MapEntry<String, double> entry in inverses.entries) {
      final weight = entry.value / sumInverse;
      final vol = assetVolatilities[entry.key]!;
      final riskContrib = weight * vol;
      portfolioVar += (weight * vol) * (weight * vol);
      results.add(
        RiskParityWeight(
          ticker: entry.key,
          weight: weight,
          volatility: vol,
          riskContribution: riskContrib,
        ),
      );
    }

    return RiskParityResult(
      weights: results,
      portfolioVolatility: _sqrt(portfolioVar),
    );
  }

  /// Babylonian method square root (pure Dart, no dart:math).
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
