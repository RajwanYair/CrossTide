/// Market Status Resolver — pure domain utility.
///
/// Determines if the market is currently open, in pre-market/after-hours,
/// or closed, based on time and day of week (US markets).
library;

import 'market_session.dart';

/// Resolves the current market status for a given point in time.
///
/// This is a stateless, const-constructible helper that delegates to
/// [MarketSession] for the actual schedule logic.
class MarketStatusResolver {
  const MarketStatusResolver();

  /// Resolve the session phase for [now] on the NYSE/NASDAQ.
  ///
  /// Weekends return [SessionPhase.closed] regardless of time.
  /// Set [isHoliday] to true for market holidays.
  SessionPhase resolve(DateTime now, {bool isHoliday = false}) {
    // Weekends are always closed.
    if (now.weekday == DateTime.saturday || now.weekday == DateTime.sunday) {
      return SessionPhase.closed;
    }
    final MarketSession session = MarketSession.nyse(
      now: now,
      isHoliday: isHoliday,
    );
    return session.phase;
  }

  /// Whether the market is in regular trading hours.
  bool isOpen(DateTime now) => resolve(now) == SessionPhase.regular;

  /// Whether the market is in an extended session (pre-market or after-hours).
  bool isExtended(DateTime now) {
    final SessionPhase phase = resolve(now);
    return phase == SessionPhase.preMarket || phase == SessionPhase.afterHours;
  }

  /// Whether the market is fully closed.
  bool isClosed(DateTime now) => resolve(now) == SessionPhase.closed;
}
