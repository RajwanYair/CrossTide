/// Market Session — pure domain value object.
///
/// Identifies the current trading session state for a given exchange.
/// Used to determine pre-market, regular, after-hours, and closed states.
library;

import 'package:equatable/equatable.dart';

/// The trading session phase.
enum SessionPhase {
  /// Before regular trading hours (pre-market).
  preMarket,

  /// Regular trading hours.
  regular,

  /// After regular close (after-hours / extended hours).
  afterHours,

  /// Market is closed (weekend, holiday, or outside all sessions).
  closed;

  /// Human-readable label.
  String get label => switch (this) {
    SessionPhase.preMarket => 'Pre-Market',
    SessionPhase.regular => 'Regular',
    SessionPhase.afterHours => 'After-Hours',
    SessionPhase.closed => 'Closed',
  };
}

/// Represents a market's session schedule for one day.
class MarketSession extends Equatable {
  const MarketSession({
    required this.exchange,
    required this.preMarketOpen,
    required this.regularOpen,
    required this.regularClose,
    required this.afterHoursClose,
    required this.now,
    this.isHoliday = false,
  });

  /// NYSE / NASDAQ defaults (US Eastern time).
  factory MarketSession.nyse({required DateTime now, bool isHoliday = false}) {
    // Eastern time offsets (simplified — not DST-aware, caller should
    // provide times already in exchange-local timezone).
    return MarketSession(
      exchange: 'NYSE',
      preMarketOpen: DateTime(now.year, now.month, now.day, 4, 0),
      regularOpen: DateTime(now.year, now.month, now.day, 9, 30),
      regularClose: DateTime(now.year, now.month, now.day, 16, 0),
      afterHoursClose: DateTime(now.year, now.month, now.day, 20, 0),
      now: now,
      isHoliday: isHoliday,
    );
  }

  /// Exchange name.
  final String exchange;

  /// Pre-market session open time.
  final DateTime preMarketOpen;

  /// Regular trading open time.
  final DateTime regularOpen;

  /// Regular trading close time.
  final DateTime regularClose;

  /// Extended hours close time.
  final DateTime afterHoursClose;

  /// Current time (injected for testability).
  final DateTime now;

  /// Whether the current day is a market holiday.
  final bool isHoliday;

  /// Determine the current session phase.
  SessionPhase get phase {
    if (isHoliday) return SessionPhase.closed;

    // Weekends (Saturday = 6, Sunday = 7)
    if (now.weekday == DateTime.saturday || now.weekday == DateTime.sunday) {
      return SessionPhase.closed;
    }

    if (now.isBefore(preMarketOpen)) return SessionPhase.closed;
    if (now.isBefore(regularOpen)) return SessionPhase.preMarket;
    if (now.isBefore(regularClose)) return SessionPhase.regular;
    if (now.isBefore(afterHoursClose)) return SessionPhase.afterHours;
    return SessionPhase.closed;
  }

  /// Whether the market is currently open (regular or extended).
  bool get isOpen => phase != SessionPhase.closed;

  /// Whether regular trading is in progress.
  bool get isRegularSession => phase == SessionPhase.regular;

  @override
  List<Object?> get props => [
    exchange,
    preMarketOpen,
    regularOpen,
    regularClose,
    afterHoursClose,
    now,
    isHoliday,
  ];
}
