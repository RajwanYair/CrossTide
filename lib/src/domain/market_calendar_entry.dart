import 'package:equatable/equatable.dart';

/// Category of a market calendar event.
enum MarketCalendarCategory {
  /// Exchange holiday — market is closed.
  holiday,

  /// Options or futures expiration.
  expiration,

  /// Central bank meeting or rate decision.
  centralBank,

  /// Scheduled government economic data release.
  economicRelease,

  /// Individual company earnings announcement.
  earnings,

  /// Stock or index inclusion/exclusion rebalance.
  indexRebalance,
}

/// A single event on the financial market calendar.
class MarketCalendarEntry extends Equatable {
  /// Creates a [MarketCalendarEntry].
  const MarketCalendarEntry({
    required this.entryId,
    required this.title,
    required this.eventDate,
    required this.category,
    required this.exchange,
    this.isConfirmed = true,
  });

  /// Unique identifier.
  final String entryId;

  /// Short title describing the event.
  final String title;

  /// Date the event occurs.
  final DateTime eventDate;

  /// Category of this event.
  final MarketCalendarCategory category;

  /// Exchange or region this event applies to (e.g. `'NYSE'`, `'LSE'`).
  final String exchange;

  /// Whether the date is confirmed (false = tentative).
  final bool isConfirmed;

  /// Returns `true` when the event closes the market.
  bool get isMarketClosed => category == MarketCalendarCategory.holiday;

  /// Returns `true` when the event has high market-moving potential.
  bool get isHighImpact =>
      category == MarketCalendarCategory.centralBank ||
      category == MarketCalendarCategory.economicRelease;

  @override
  List<Object?> get props => [
    entryId,
    title,
    eventDate,
    category,
    exchange,
    isConfirmed,
  ];
}
