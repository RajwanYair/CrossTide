import 'package:equatable/equatable.dart';

/// A single bucket in a per-ticker alert frequency histogram.
class AlertHistogramBucket extends Equatable {
  const AlertHistogramBucket({
    required this.hourOfDay,
    required this.alertCount,
  });

  /// Hour of day (0–23).
  final int hourOfDay;

  final int alertCount;

  @override
  List<Object?> get props => [hourOfDay, alertCount];
}

/// Per-ticker histogram of alert occurrences by hour of day.
class TickerAlertHistogram extends Equatable {
  const TickerAlertHistogram({
    required this.ticker,
    required this.buckets,
    required this.totalAlerts,
  });

  final String ticker;

  /// 24 buckets (one per hour). May be sparse.
  final List<AlertHistogramBucket> buckets;

  final int totalAlerts;

  /// Returns the bucket with the highest alert count, or null if empty.
  AlertHistogramBucket? get peakHour {
    if (buckets.isEmpty) return null;
    return buckets.reduce((a, b) => a.alertCount >= b.alertCount ? a : b);
  }

  /// Returns count for a specific hour (0–23), or 0 if no bucket.
  int countAt(int hour) => buckets
      .where((b) => b.hourOfDay == hour)
      .fold(0, (sum, b) => sum + b.alertCount);

  @override
  List<Object?> get props => [ticker, buckets, totalAlerts];
}
