import 'package:equatable/equatable.dart';

/// Snapshot of a simplified option chain at a given expiry.
class OptionChainSummary extends Equatable {
  const OptionChainSummary({
    required this.ticker,
    required this.expiryDate,
    required this.underlyingPrice,
    required this.callOpenInterest,
    required this.putOpenInterest,
    required this.atMoneyImpliedVolatility,
    required this.numberOfStrikes,
  });

  final String ticker;
  final DateTime expiryDate;

  /// Underlying price at time of snapshot.
  final double underlyingPrice;

  /// Aggregate call open interest across all strikes.
  final int callOpenInterest;

  /// Aggregate put open interest across all strikes.
  final int putOpenInterest;

  /// Implied volatility of the at-the-money straddle (0.0–1.0).
  final double atMoneyImpliedVolatility;

  final int numberOfStrikes;

  /// Put/Call OI ratio. Higher values suggest bearish options positioning.
  double get putCallRatio =>
      callOpenInterest == 0 ? 0 : putOpenInterest / callOpenInterest;

  /// Total open interest across calls and puts.
  int get totalOpenInterest => callOpenInterest + putOpenInterest;

  /// Annualised implied volatility as a percentage.
  double get impliedVolatilityPct => atMoneyImpliedVolatility * 100;

  /// True when the put/call ratio exceeds 1.0 (more puts than calls).
  bool get isBearishPositioning => putCallRatio > 1.0;

  @override
  List<Object?> get props => [
    ticker,
    expiryDate,
    underlyingPrice,
    callOpenInterest,
    putOpenInterest,
    atMoneyImpliedVolatility,
    numberOfStrikes,
  ];
}
