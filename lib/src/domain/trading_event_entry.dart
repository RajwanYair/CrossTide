import 'package:equatable/equatable.dart';

/// Category of a trading or market-related event.
enum TradingEventCategory {
  fomc,
  inflation,
  employment,
  gdp,
  earnings,
  dividendEx,
  optionExpiry,
  indexRebalance,
  custom,
}

/// Impact level of a trading event.
enum TradingEventImpact { low, medium, high, critical }

/// A single trading or economic event entry.
class TradingEventEntry extends Equatable {
  const TradingEventEntry({
    required this.eventId,
    required this.title,
    required this.category,
    required this.impact,
    required this.eventDate,
    this.affectedTickers = const [],
    this.notes,
  });

  final String eventId;
  final String title;
  final TradingEventCategory category;
  final TradingEventImpact impact;
  final DateTime eventDate;

  /// Tickers directly affected by this event.
  final List<String> affectedTickers;

  final String? notes;

  bool get isHighImpact =>
      impact == TradingEventImpact.high ||
      impact == TradingEventImpact.critical;

  bool get affectsMarketWide => affectedTickers.isEmpty;

  @override
  List<Object?> get props => [
    eventId,
    title,
    category,
    impact,
    eventDate,
    affectedTickers,
    notes,
  ];
}
