/// Trading Session Calendar — defines market hours for major exchanges
/// and detects whether a given time falls within a trading session.
library;

import 'package:equatable/equatable.dart';

/// A named trading exchange/session.
enum Exchange { nyse, nasdaq, lse, tse, hkex, asx }

/// Session phase: pre-market, regular, after-hours, or closed.
enum ExchangeSessionPhase { preMarket, regular, afterHours, closed }

/// Definition of a trading session's hours (in UTC).
class SessionHours extends Equatable {
  const SessionHours({
    required this.exchange,
    required this.preMarketOpenUtc,
    required this.regularOpenUtc,
    required this.regularCloseUtc,
    required this.afterHoursCloseUtc,
    required this.tradingDays,
  });

  final Exchange exchange;

  /// Pre-market open hour (UTC). Null if no pre-market.
  final int? preMarketOpenUtc;

  /// Regular session open hour (UTC).
  final int regularOpenUtc;

  /// Regular session close hour (UTC).
  final int regularCloseUtc;

  /// After-hours close hour (UTC). Null if no after-hours.
  final int? afterHoursCloseUtc;

  /// Days of the week the exchange is open (1=Mon, 7=Sun).
  final Set<int> tradingDays;

  @override
  List<Object?> get props => [
    exchange,
    preMarketOpenUtc,
    regularOpenUtc,
    regularCloseUtc,
    afterHoursCloseUtc,
    tradingDays,
  ];
}

/// Result of checking session status.
class SessionStatus extends Equatable {
  const SessionStatus({
    required this.exchange,
    required this.phase,
    required this.checkedAt,
  });

  final Exchange exchange;
  final ExchangeSessionPhase phase;
  final DateTime checkedAt;

  bool get isOpen => phase == ExchangeSessionPhase.regular;
  bool get isExtendedHours =>
      phase == ExchangeSessionPhase.preMarket ||
      phase == ExchangeSessionPhase.afterHours;

  @override
  List<Object?> get props => [exchange, phase, checkedAt];
}

/// Determines current trading session phase for exchanges.
class TradingSessionCalendar {
  const TradingSessionCalendar();

  /// Standard session definitions.
  static const Map<Exchange, SessionHours> _defaults = {
    Exchange.nyse: SessionHours(
      exchange: Exchange.nyse,
      preMarketOpenUtc: 8, // 4:00 AM ET
      regularOpenUtc: 13, // 9:30 AM ET (approx)
      regularCloseUtc: 20, // 4:00 PM ET
      afterHoursCloseUtc: 24, // 8:00 PM ET
      tradingDays: {1, 2, 3, 4, 5},
    ),
    Exchange.nasdaq: SessionHours(
      exchange: Exchange.nasdaq,
      preMarketOpenUtc: 8,
      regularOpenUtc: 13,
      regularCloseUtc: 20,
      afterHoursCloseUtc: 24,
      tradingDays: {1, 2, 3, 4, 5},
    ),
    Exchange.lse: SessionHours(
      exchange: Exchange.lse,
      preMarketOpenUtc: 5,
      regularOpenUtc: 8,
      regularCloseUtc: 16,
      afterHoursCloseUtc: 17,
      tradingDays: {1, 2, 3, 4, 5},
    ),
    Exchange.tse: SessionHours(
      exchange: Exchange.tse,
      preMarketOpenUtc: null,
      regularOpenUtc: 0, // 9:00 AM JST
      regularCloseUtc: 6, // 3:00 PM JST
      afterHoursCloseUtc: null,
      tradingDays: {1, 2, 3, 4, 5},
    ),
    Exchange.hkex: SessionHours(
      exchange: Exchange.hkex,
      preMarketOpenUtc: null,
      regularOpenUtc: 1, // 9:30 AM HKT
      regularCloseUtc: 8, // 4:00 PM HKT
      afterHoursCloseUtc: null,
      tradingDays: {1, 2, 3, 4, 5},
    ),
    Exchange.asx: SessionHours(
      exchange: Exchange.asx,
      preMarketOpenUtc: null,
      regularOpenUtc: 0, // 10:00 AM AEST
      regularCloseUtc: 6, // 4:00 PM AEST
      afterHoursCloseUtc: null,
      tradingDays: {1, 2, 3, 4, 5},
    ),
  };

  /// Check the session phase for an exchange at [utcTime].
  SessionStatus checkSession({
    required Exchange exchange,
    required DateTime utcTime,
  }) {
    final hours = _defaults[exchange];
    if (hours == null) {
      return SessionStatus(
        exchange: exchange,
        phase: ExchangeSessionPhase.closed,
        checkedAt: utcTime,
      );
    }

    if (!hours.tradingDays.contains(utcTime.weekday)) {
      return SessionStatus(
        exchange: exchange,
        phase: ExchangeSessionPhase.closed,
        checkedAt: utcTime,
      );
    }

    final hour = utcTime.hour;
    final phase = _resolvePhase(hour, hours);

    return SessionStatus(exchange: exchange, phase: phase, checkedAt: utcTime);
  }

  /// Check all major exchanges at once.
  List<SessionStatus> checkAll(DateTime utcTime) => [
    for (final Exchange ex in Exchange.values)
      checkSession(exchange: ex, utcTime: utcTime),
  ];

  ExchangeSessionPhase _resolvePhase(int hour, SessionHours hours) {
    if (hour >= hours.regularOpenUtc && hour < hours.regularCloseUtc) {
      return ExchangeSessionPhase.regular;
    }

    if (hours.preMarketOpenUtc != null &&
        hour >= hours.preMarketOpenUtc! &&
        hour < hours.regularOpenUtc) {
      return ExchangeSessionPhase.preMarket;
    }

    if (hours.afterHoursCloseUtc != null &&
        hour >= hours.regularCloseUtc &&
        hour < hours.afterHoursCloseUtc!) {
      return ExchangeSessionPhase.afterHours;
    }

    return ExchangeSessionPhase.closed;
  }
}
