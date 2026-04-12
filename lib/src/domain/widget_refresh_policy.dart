import 'package:equatable/equatable.dart';

/// Trigger condition for a home-screen widget data refresh.
enum WidgetRefreshTrigger {
  /// Periodic timer-based refresh.
  periodic,

  /// Refresh triggered when app returns to foreground.
  onForeground,

  /// Refresh triggered by a push notification.
  onPushNotification,

  /// Manual user-triggered pull-to-refresh.
  manual,
}

/// Policy governing when and how often a home-screen widget refreshes its data.
class WidgetRefreshPolicy extends Equatable {
  const WidgetRefreshPolicy({
    required this.widgetId,
    required this.trigger,
    required this.minIntervalSeconds,
    required this.maxAgeSeconds,
    this.enabled = true,
    this.refreshOnWifiOnly = false,
  });

  final String widgetId;
  final WidgetRefreshTrigger trigger;

  /// Minimum time between refreshes to avoid excessive network calls.
  final int minIntervalSeconds;

  /// Maximum cached data age before the widget shows "stale" indicator.
  final int maxAgeSeconds;

  final bool enabled;

  /// `true` to skip refresh when on cellular data.
  final bool refreshOnWifiOnly;

  WidgetRefreshPolicy copyWith({
    String? widgetId,
    WidgetRefreshTrigger? trigger,
    int? minIntervalSeconds,
    int? maxAgeSeconds,
    bool? enabled,
    bool? refreshOnWifiOnly,
  }) => WidgetRefreshPolicy(
    widgetId: widgetId ?? this.widgetId,
    trigger: trigger ?? this.trigger,
    minIntervalSeconds: minIntervalSeconds ?? this.minIntervalSeconds,
    maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
    enabled: enabled ?? this.enabled,
    refreshOnWifiOnly: refreshOnWifiOnly ?? this.refreshOnWifiOnly,
  );

  @override
  List<Object?> get props => [
    widgetId,
    trigger,
    minIntervalSeconds,
    maxAgeSeconds,
    enabled,
    refreshOnWifiOnly,
  ];
}
