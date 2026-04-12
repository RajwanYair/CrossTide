import 'package:equatable/equatable.dart';

/// Style of an options expiry date.
enum OptionsExpiryStyle {
  /// Standard monthly expiry (third Friday).
  monthly,

  /// Weekly expiry.
  weekly,

  /// Quarterly expiry.
  quarterly,

  /// LEAPS (Long-Term Equity Anticipation Securities).
  leaps,
}

/// A single options expiration date entry for a ticker.
class OptionsExpiryDate extends Equatable {
  const OptionsExpiryDate({
    required this.ticker,
    required this.expiryDate,
    required this.style,
    required this.daysToExpiry,
    this.openInterest,
    this.impliedVolatility,
  });

  final String ticker;
  final DateTime expiryDate;
  final OptionsExpiryStyle style;

  /// Calendar days from today to expiry.
  final int daysToExpiry;

  /// Total open interest across all strikes for this expiry.
  final int? openInterest;

  /// At-the-money implied volatility for this expiry.
  final double? impliedVolatility;

  OptionsExpiryDate copyWith({
    String? ticker,
    DateTime? expiryDate,
    OptionsExpiryStyle? style,
    int? daysToExpiry,
    int? openInterest,
    double? impliedVolatility,
  }) => OptionsExpiryDate(
    ticker: ticker ?? this.ticker,
    expiryDate: expiryDate ?? this.expiryDate,
    style: style ?? this.style,
    daysToExpiry: daysToExpiry ?? this.daysToExpiry,
    openInterest: openInterest ?? this.openInterest,
    impliedVolatility: impliedVolatility ?? this.impliedVolatility,
  );

  @override
  List<Object?> get props => [
    ticker,
    expiryDate,
    style,
    daysToExpiry,
    openInterest,
    impliedVolatility,
  ];
}
