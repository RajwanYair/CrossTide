import 'package:equatable/equatable.dart';

/// Refresh mode for a widget data feed (S500).
enum WidgetRefreshMode { realtime, periodic, onDemand, eventDriven }

/// Data feed configuration for a home-screen or dashboard widget (S500).
class WidgetDataFeed extends Equatable {
  const WidgetDataFeed({
    required this.feedId,
    required this.widgetId,
    required this.dataKey,
    required this.refreshMode,
    required this.refreshIntervalSeconds,
    this.isEnabled = true,
    this.priority = 0,
  });

  final String feedId;
  final String widgetId;

  /// Logical key identifying which data this feed provides.
  final String dataKey;
  final WidgetRefreshMode refreshMode;

  /// Seconds between refreshes (used only in [WidgetRefreshMode.periodic]).
  final int refreshIntervalSeconds;
  final bool isEnabled;

  /// Higher values indicate higher scheduling priority.
  final int priority;

  bool get isRealtime => refreshMode == WidgetRefreshMode.realtime;
  bool get isHighPriority => priority >= 10;
  bool get isFrequentRefresh =>
      refreshMode == WidgetRefreshMode.periodic && refreshIntervalSeconds <= 60;

  @override
  List<Object?> get props => [
    feedId,
    widgetId,
    dataKey,
    refreshMode,
    refreshIntervalSeconds,
    isEnabled,
    priority,
  ];
}
