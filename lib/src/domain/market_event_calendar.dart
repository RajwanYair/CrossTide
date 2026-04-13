import 'package:equatable/equatable.dart';

/// Market event calendar — upcoming scheduled market event.
enum MarketEventType {
  earnings,
  dividendEx,
  fedMeeting,
  cpiRelease,
  nfpRelease,
  ipoLock,
  indexRebalance,
  holidayClose,
}

class MarketEventCalendar extends Equatable {
  const MarketEventCalendar({
    required this.eventId,
    required this.ticker,
    required this.eventType,
    required this.eventDate,
    required this.isConfirmed,
  });

  final String eventId;
  final String ticker;
  final MarketEventType eventType;
  final String eventDate;
  final bool isConfirmed;

  MarketEventCalendar copyWith({
    String? eventId,
    String? ticker,
    MarketEventType? eventType,
    String? eventDate,
    bool? isConfirmed,
  }) => MarketEventCalendar(
    eventId: eventId ?? this.eventId,
    ticker: ticker ?? this.ticker,
    eventType: eventType ?? this.eventType,
    eventDate: eventDate ?? this.eventDate,
    isConfirmed: isConfirmed ?? this.isConfirmed,
  );

  @override
  List<Object?> get props => [
    eventId,
    ticker,
    eventType,
    eventDate,
    isConfirmed,
  ];
}
