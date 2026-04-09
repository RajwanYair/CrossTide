/// Widget Refresh Schedule — Android home-screen widget and Windows tile refresh config.
library;

import 'package:equatable/equatable.dart';

/// Event that triggers a widget / tile refresh.
enum RefreshTrigger {
  /// User explicitly tapped the refresh button on the widget.
  manual,

  /// Periodic timer-based refresh (see [RefreshInterval]).
  timer,

  /// Device network connectivity was restored.
  onNetworkChange,

  /// App returned to the foreground.
  onForeground,

  /// Device was rebooted (Android AlarmManager / Windows Task Scheduler). 
  onBoot,
}

/// Preset time intervals for periodic widget refreshes.
enum RefreshInterval {
  /// Every 15 minutes.
  min15,

  /// Every 30 minutes.
  min30,

  /// Every 1 hour.
  hour1,

  /// Every 2 hours.
  hour2,

  /// Every 4 hours.
  hour4,

  /// Every 8 hours.
  hour8,

  /// Every 24 hours.
  hour24,
}

/// Returns the number of minutes in [interval].
extension RefreshIntervalMinutes on RefreshInterval {
  int get minutes => switch (this) {
    RefreshInterval.min15 => 15,
    RefreshInterval.min30 => 30,
    RefreshInterval.hour1 => 60,
    RefreshInterval.hour2 => 120,
    RefreshInterval.hour4 => 240,
    RefreshInterval.hour8 => 480,
    RefreshInterval.hour24 => 1440,
  };
}

/// Refresh schedule for a single widget or tile instance.
class WidgetRefreshSchedule extends Equatable {
  const WidgetRefreshSchedule({
    required this.widgetId,
    required this.triggers,
    required this.interval,
    required this.enabled,
    this.lastRefreshedAt,
  });

  /// Stable identifier assigned when the widget is added to the home screen.
  final String widgetId;

  /// Which events cause the widget to refresh its data.
  final List<RefreshTrigger> triggers;

  /// Polling interval used when [RefreshTrigger.timer] is active.
  final RefreshInterval interval;

  final bool enabled;

  /// Timestamp of the most recent successful refresh; null if never refreshed.
  final DateTime? lastRefreshedAt;

  /// Returns true when the last refresh was more than [interval] minutes ago at [now].
  bool isOverdueAt(DateTime now) {
    if (lastRefreshedAt == null) return true;
    final elapsed = now.difference(lastRefreshedAt!).inMinutes;
    return elapsed >= interval.minutes;
  }

  @override
  List<Object?> get props => [
    widgetId,
    triggers,
    interval,
    enabled,
    lastRefreshedAt,
  ];
}
