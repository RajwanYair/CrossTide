import 'package:equatable/equatable.dart';

/// Snapshot of option Greeks for a single contract.
class OptionGreeksSnapshot extends Equatable {
  const OptionGreeksSnapshot({
    required this.underlyingSymbol,
    required this.strikePrice,
    required this.expiryDate,
    required this.optionType,
    required this.delta,
    required this.gamma,
    required this.theta,
    required this.vega,
    required this.rho,
    required this.impliedVolatility,
    required this.snapshotAt,
  });

  final String underlyingSymbol;
  final double strikePrice;
  final DateTime expiryDate;

  /// 'call' or 'put'.
  final String optionType;

  /// Delta: rate of change of option price w.r.t. underlying.
  final double delta;

  /// Gamma: rate of change of delta.
  final double gamma;

  /// Theta: time decay per day.
  final double theta;

  /// Vega: sensitivity to 1 % change in implied volatility.
  final double vega;

  /// Rho: sensitivity to interest rate change.
  final double rho;

  /// Implied volatility as a percentage.
  final double impliedVolatility;

  final DateTime snapshotAt;

  bool get isCall => optionType == 'call';
  bool get isPut => optionType == 'put';

  /// Returns true when delta indicates deep in-the-money (|delta| >= 0.8).
  bool get isDeepInTheMoney => delta.abs() >= 0.8;

  @override
  List<Object?> get props => [
    underlyingSymbol,
    strikePrice,
    expiryDate,
    optionType,
    delta,
    gamma,
    theta,
    vega,
    rho,
    impliedVolatility,
    snapshotAt,
  ];
}
