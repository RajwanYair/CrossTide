import 'package:equatable/equatable.dart';

/// Granularity of an alert frequency measurement.
enum AlertFrequencyPeriod { daily, weekly, monthly }

/// Alert frequency statistics for a single ticker over a time period.
class AlertFrequencyStats extends Equatable {
  const AlertFrequencyStats({
    required this.ticker,
    required this.period,
    required this.alertCount,
    required this.periodStart,
    required this.periodEnd,
    this.buyAlertCount = 0,
    this.sellAlertCount = 0,
  });

  final String ticker;
  final AlertFrequencyPeriod period;
  final int alertCount;
  final DateTime periodStart;
  final DateTime periodEnd;
  final int buyAlertCount;
  final int sellAlertCount;

  Duration get periodDuration => periodEnd.difference(periodStart);

  /// Alerts per day within this period.
  double get alertsPerDay {
    final int days = periodDuration.inDays;
    return days == 0 ? 0 : alertCount / days;
  }

  /// Fraction of alerts that are BUY signals.
  double get buyRatio => alertCount == 0 ? 0 : buyAlertCount / alertCount;

  /// Fraction of alerts that are SELL signals.
  double get sellRatio => alertCount == 0 ? 0 : sellAlertCount / alertCount;

  bool get isEmpty => alertCount == 0;

  @override
  List<Object?> get props => [
    ticker,
    period,
    alertCount,
    periodStart,
    periodEnd,
    buyAlertCount,
    sellAlertCount,
  ];
}
