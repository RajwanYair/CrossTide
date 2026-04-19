/// Smart Cache TTL Calculator — Pure domain logic.
///
/// Calculates dynamic TTL (time-to-live) for cached market data based on
/// market open/close hours. During market hours, TTL is short (frequent
/// refresh). Outside hours, TTL is long (no new data expected).
library;

import 'package:equatable/equatable.dart';

/// US market session boundaries (Eastern Time, 24h format).
class MarketHours extends Equatable {
  const MarketHours({
    this.preMarketOpen = 4,
    this.regularOpen = 9,
    this.regularOpenMinute = 30,
    this.regularClose = 16,
    this.afterHoursClose = 20,
  });

  final int preMarketOpen;
  final int regularOpen;
  final int regularOpenMinute;
  final int regularClose;
  final int afterHoursClose;

  @override
  List<Object?> get props => [
    preMarketOpen,
    regularOpen,
    regularOpenMinute,
    regularClose,
    afterHoursClose,
  ];
}

/// Result of a cache TTL calculation.
class CacheTtlResult extends Equatable {
  const CacheTtlResult({
    required this.ttlMinutes,
    required this.reason,
    required this.isMarketOpen,
  });

  final int ttlMinutes;
  final String reason;
  final bool isMarketOpen;

  @override
  List<Object?> get props => [ttlMinutes, reason, isMarketOpen];
}

/// Computes smart cache TTL based on current time relative to market hours.
class SmartCacheTtlCalculator {
  const SmartCacheTtlCalculator();

  /// Default TTLs.
  static const int duringMarketMinutes = 5;
  static const int preMarketMinutes = 15;
  static const int afterHoursMinutes = 30;
  static const int closedMinutes = 120;
  static const int weekendMinutes = 360;

  /// Calculate the TTL for the current moment.
  ///
  /// [now] should be in Eastern Time (or adjusted by caller).
  CacheTtlResult calculate(
    DateTime now, {
    MarketHours hours = const MarketHours(),
  }) {
    final int weekday = now.weekday; // 1=Mon, 7=Sun
    final int hour = now.hour;
    final int minute = now.minute;
    final int timeInMinutes = hour * 60 + minute;

    // Weekend: Saturday (6) or Sunday (7)
    if (weekday == 6 || weekday == 7) {
      return const CacheTtlResult(
        ttlMinutes: weekendMinutes,
        reason: 'Weekend — market closed',
        isMarketOpen: false,
      );
    }

    final int regularOpenMinutes =
        hours.regularOpen * 60 + hours.regularOpenMinute;
    final int regularCloseMinutes = hours.regularClose * 60;
    final int preMarketMinutesOfDay = hours.preMarketOpen * 60;
    final int afterHoursMinutesOfDay = hours.afterHoursClose * 60;

    // Regular market hours
    if (timeInMinutes >= regularOpenMinutes &&
        timeInMinutes < regularCloseMinutes) {
      return const CacheTtlResult(
        ttlMinutes: duringMarketMinutes,
        reason: 'Regular market hours',
        isMarketOpen: true,
      );
    }

    // Pre-market
    if (timeInMinutes >= preMarketMinutesOfDay &&
        timeInMinutes < regularOpenMinutes) {
      return const CacheTtlResult(
        ttlMinutes: preMarketMinutes,
        reason: 'Pre-market session',
        isMarketOpen: false,
      );
    }

    // After-hours
    if (timeInMinutes >= regularCloseMinutes &&
        timeInMinutes < afterHoursMinutesOfDay) {
      return const CacheTtlResult(
        ttlMinutes: afterHoursMinutes,
        reason: 'After-hours session',
        isMarketOpen: false,
      );
    }

    // Market closed (before pre-market or after after-hours)
    return const CacheTtlResult(
      ttlMinutes: closedMinutes,
      reason: 'Market closed',
      isMarketOpen: false,
    );
  }
}
