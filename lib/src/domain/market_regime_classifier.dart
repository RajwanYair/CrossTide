/// Market Regime Classifier — classifies the overall market state
/// into bull, bear, or sideways based on multiple indicators.
library;

import 'package:equatable/equatable.dart';

/// Market regime classification.
enum MarketRegime { bull, bear, sideways }

/// Input signals for regime classification.
class RegimeInput extends Equatable {
  const RegimeInput({
    required this.priceAboveSma200,
    required this.sma50AboveSma200,
    required this.rsi,
    required this.adx,
    required this.breadthThrust,
  });

  /// Whether current price is above the 200-day SMA.
  final bool priceAboveSma200;

  /// Whether the 50-day SMA is above the 200-day SMA.
  final bool sma50AboveSma200;

  /// Current RSI value (0–100).
  final double rsi;

  /// Current ADX value (0–100, >25 = trending).
  final double adx;

  /// Market breadth thrust (0–1, >0.6 = strong advance).
  final double breadthThrust;

  @override
  List<Object?> get props => [
    priceAboveSma200,
    sma50AboveSma200,
    rsi,
    adx,
    breadthThrust,
  ];
}

/// Result of market regime classification.
class MarketRegimeResult extends Equatable {
  const MarketRegimeResult({
    required this.regime,
    required this.confidence,
    required this.bullScore,
    required this.bearScore,
  });

  final MarketRegime regime;

  /// Confidence in the classification (0–100).
  final double confidence;

  /// Composite bull score (0–100).
  final double bullScore;

  /// Composite bear score (0–100).
  final double bearScore;

  @override
  List<Object?> get props => [regime, confidence, bullScore, bearScore];
}

/// Classifies market regime from input signals.
class MarketRegimeClassifier {
  const MarketRegimeClassifier();

  /// Classify the current market regime.
  MarketRegimeResult classify(RegimeInput input) {
    var bullPoints = 0.0;
    var bearPoints = 0.0;

    // Price vs SMA200 (30 points)
    if (input.priceAboveSma200) {
      bullPoints += 30;
    } else {
      bearPoints += 30;
    }

    // SMA50 vs SMA200 (25 points)
    if (input.sma50AboveSma200) {
      bullPoints += 25;
    } else {
      bearPoints += 25;
    }

    // RSI (20 points)
    if (input.rsi > 50) {
      bullPoints += 20 * ((input.rsi - 50) / 50);
    } else {
      bearPoints += 20 * ((50 - input.rsi) / 50);
    }

    // Breadth (25 points)
    if (input.breadthThrust > 0.5) {
      bullPoints += 25 * ((input.breadthThrust - 0.5) / 0.5);
    } else {
      bearPoints += 25 * ((0.5 - input.breadthThrust) / 0.5);
    }

    // ADX determines trending vs sideways
    final isTrending = input.adx > 25;

    final MarketRegime regime;
    final double confidence;

    if (!isTrending && (bullPoints - bearPoints).abs() < 20) {
      regime = MarketRegime.sideways;
      confidence = 100 - (bullPoints - bearPoints).abs();
    } else if (bullPoints > bearPoints) {
      regime = MarketRegime.bull;
      confidence = (bullPoints / (bullPoints + bearPoints)) * 100;
    } else {
      regime = MarketRegime.bear;
      confidence = (bearPoints / (bullPoints + bearPoints)) * 100;
    }

    return MarketRegimeResult(
      regime: regime,
      confidence: confidence.clamp(0, 100),
      bullScore: bullPoints,
      bearScore: bearPoints,
    );
  }
}
