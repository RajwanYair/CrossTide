/// Alert Schedule Validator — Pure domain logic.
///
/// Validates whether an alert should fire based on market hours and
/// user-configured quiet hours. Prevents alert noise outside trading sessions.
library;

import 'package:equatable/equatable.dart';

/// Configuration for alert scheduling.
class AlertScheduleConfig extends Equatable {
  const AlertScheduleConfig({
    this.onlyDuringMarketHours = false,
    this.quietHoursStart,
    this.quietHoursEnd,
    this.timezone = 'America/New_York',
    this.allowWeekends = false,
  });

  /// If true, alerts only fire during regular market hours (9:30–16:00 ET).
  final bool onlyDuringMarketHours;

  /// Hour of day (0–23) when quiet hours begin. Null = no quiet hours.
  final int? quietHoursStart;

  /// Hour of day (0–23) when quiet hours end. Null = no quiet hours.
  final int? quietHoursEnd;

  /// Timezone for schedule evaluation.
  final String timezone;

  /// Whether to allow alerts on weekends.
  final bool allowWeekends;

  bool get hasQuietHours => quietHoursStart != null && quietHoursEnd != null;

  @override
  List<Object?> get props => [
    onlyDuringMarketHours,
    quietHoursStart,
    quietHoursEnd,
    timezone,
    allowWeekends,
  ];
}

/// Result of schedule validation.
class ScheduleCheckResult extends Equatable {
  const ScheduleCheckResult({required this.allowed, required this.reason});

  final bool allowed;
  final String reason;

  @override
  List<Object?> get props => [allowed, reason];
}

/// Validates alert timing against schedule configuration.
class AlertScheduleValidator {
  const AlertScheduleValidator();

  /// Check if an alert is allowed to fire at the given time.
  ///
  /// [now] should be in the user's configured timezone (caller responsibility).
  ScheduleCheckResult check(DateTime now, AlertScheduleConfig config) {
    // Weekend check
    if (!config.allowWeekends && (now.weekday == 6 || now.weekday == 7)) {
      return const ScheduleCheckResult(
        allowed: false,
        reason: 'Weekend — alerts suppressed',
      );
    }

    // Market hours check
    if (config.onlyDuringMarketHours) {
      final int timeMinutes = now.hour * 60 + now.minute;
      const int marketOpen = 9 * 60 + 30; // 9:30 ET
      const int marketClose = 16 * 60; // 16:00 ET

      if (timeMinutes < marketOpen || timeMinutes >= marketClose) {
        return const ScheduleCheckResult(
          allowed: false,
          reason: 'Outside market hours (9:30–16:00)',
        );
      }
    }

    // Quiet hours check
    if (config.hasQuietHours) {
      final int hour = now.hour;
      final int start = config.quietHoursStart!;
      final int end = config.quietHoursEnd!;

      bool inQuietHours;
      if (start <= end) {
        // Same day quiet hours (e.g., 22:00–06:00 would be start > end)
        inQuietHours = hour >= start && hour < end;
      } else {
        // Overnight quiet hours (e.g., 22–6)
        inQuietHours = hour >= start || hour < end;
      }

      if (inQuietHours) {
        return ScheduleCheckResult(
          allowed: false,
          reason: 'Quiet hours ($start:00–$end:00)',
        );
      }
    }

    return const ScheduleCheckResult(
      allowed: true,
      reason: 'Within allowed schedule',
    );
  }
}
