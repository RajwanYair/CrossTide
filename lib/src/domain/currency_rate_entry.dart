import 'package:equatable/equatable.dart';

/// A single foreign-exchange rate observation.
class CurrencyRateEntry extends Equatable {
  const CurrencyRateEntry({
    required this.baseCurrency,
    required this.quoteCurrency,
    required this.midRate,
    required this.observedAt,
    this.bidRate,
    this.askRate,
  });

  /// ISO 4217 base currency code (e.g. 'USD').
  final String baseCurrency;

  /// ISO 4217 quote currency code (e.g. 'EUR').
  final String quoteCurrency;

  /// Mid (mid-market) exchange rate.
  final double midRate;

  final DateTime observedAt;

  /// Bid rate (market maker buys base). Nullable when not available.
  final double? bidRate;

  /// Ask rate (market maker sells base). Nullable when not available.
  final double? askRate;

  /// Bid-ask spread. Null when bid or ask is unavailable.
  double? get spread =>
      (bidRate != null && askRate != null) ? askRate! - bidRate! : null;

  /// Convert [amount] in base currency to quote currency.
  double convert(double amount) => amount * midRate;

  /// Canonical pair label e.g. 'USD/EUR'.
  String get pairLabel => '$baseCurrency/$quoteCurrency';

  @override
  List<Object?> get props => [
    baseCurrency,
    quoteCurrency,
    midRate,
    observedAt,
    bidRate,
    askRate,
  ];
}
