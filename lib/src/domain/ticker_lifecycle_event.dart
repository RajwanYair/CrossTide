import 'package:equatable/equatable.dart';

/// Type of ticker lifecycle event.
enum TickerLifecycleEventType {
  listed,
  delisted,
  suspended,
  reinstated,
  renamed,
  spunOff,
  merged,
  symbolChanged,
}

/// A recorded lifecycle event for a ticker (listing, delisting, rename, etc.).
class TickerLifecycleEvent extends Equatable {
  const TickerLifecycleEvent({
    required this.ticker,
    required this.eventType,
    required this.eventDate,
    required this.exchange,
    this.previousSymbol,
    this.newSymbol,
    this.relatedTicker,
    this.notes,
  });

  final String ticker;
  final TickerLifecycleEventType eventType;
  final DateTime eventDate;
  final String exchange;

  /// For symbolChanged / renamed events.
  final String? previousSymbol;
  final String? newSymbol;

  /// Counterparty ticker for merger / spin-off events.
  final String? relatedTicker;

  final String? notes;

  TickerLifecycleEvent copyWith({
    String? ticker,
    TickerLifecycleEventType? eventType,
    DateTime? eventDate,
    String? exchange,
    String? previousSymbol,
    String? newSymbol,
    String? relatedTicker,
    String? notes,
  }) => TickerLifecycleEvent(
    ticker: ticker ?? this.ticker,
    eventType: eventType ?? this.eventType,
    eventDate: eventDate ?? this.eventDate,
    exchange: exchange ?? this.exchange,
    previousSymbol: previousSymbol ?? this.previousSymbol,
    newSymbol: newSymbol ?? this.newSymbol,
    relatedTicker: relatedTicker ?? this.relatedTicker,
    notes: notes ?? this.notes,
  );

  @override
  List<Object?> get props => [
    ticker,
    eventType,
    eventDate,
    exchange,
    previousSymbol,
    newSymbol,
    relatedTicker,
    notes,
  ];
}
