/// Android Widget Config — home-screen widget data model.
library;

import 'package:equatable/equatable.dart';

/// Layout style for the Android home-screen widget.
enum WidgetLayoutStyle {
  /// Compact single-row card: ticker symbol + price + signal badge.
  compact,

  /// Medium card: includes last price, distance from SMA200, and alert badge.
  medium,

  /// Full card: price, SMA overlay bars, alert count, and last updated time.
  expanded,
}

/// Badge style shown when a consensus signal is active.
enum WidgetSignalBadge {
  /// No badge displayed.
  none,

  /// Green dot badge.
  dot,

  /// Coloured banner with BUY/SELL text.
  banner,
}

/// Configuration for a single Android home-screen widget instance.
///
/// Each widget is identified by [widgetId] (Android app-widget ID).
/// Multiple widget instances may display different tickers.
class AndroidWidgetConfig extends Equatable {
  const AndroidWidgetConfig({
    required this.widgetId,
    required this.ticker,
    required this.layoutStyle,
    required this.signalBadge,
    this.showSma200Distance = true,
    this.showLastUpdated = true,
    this.refreshIntervalMinutes = 15,
  }) : assert(
            refreshIntervalMinutes >= 15,
            'Android widget refresh interval must be at least 15 minutes '
            '(OS minimum for WorkManager periodic tasks)');

  /// Android app-widget instance ID.
  final int widgetId;

  /// Ticker symbol to display.
  final String ticker;

  /// Layout variant.
  final WidgetLayoutStyle layoutStyle;

  /// Signal badge style.
  final WidgetSignalBadge signalBadge;

  /// Show % distance from SMA200.
  final bool showSma200Distance;

  /// Show "Updated X min ago" label.
  final bool showLastUpdated;

  /// How often to refresh widget data (minimum 15 min).
  final int refreshIntervalMinutes;

  @override
  List<Object?> get props => [
        widgetId,
        ticker,
        layoutStyle,
        signalBadge,
        showSma200Distance,
        showLastUpdated,
        refreshIntervalMinutes,
      ];
}
