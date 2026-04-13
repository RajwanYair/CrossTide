import 'package:equatable/equatable.dart';

/// Alert throttle window — per-method alert frequency cap.
enum AlertWindowUnit { minute, hour, day, week }

class AlertThrottleWindow extends Equatable {
  const AlertThrottleWindow({
    required this.ticker,
    required this.method,
    required this.maxAlerts,
    required this.windowSize,
    required this.windowUnit,
  });

  final String ticker;
  final String method;
  final int maxAlerts;
  final int windowSize;
  final AlertWindowUnit windowUnit;

  AlertThrottleWindow copyWith({
    String? ticker,
    String? method,
    int? maxAlerts,
    int? windowSize,
    AlertWindowUnit? windowUnit,
  }) => AlertThrottleWindow(
    ticker: ticker ?? this.ticker,
    method: method ?? this.method,
    maxAlerts: maxAlerts ?? this.maxAlerts,
    windowSize: windowSize ?? this.windowSize,
    windowUnit: windowUnit ?? this.windowUnit,
  );

  @override
  List<Object?> get props => [
    ticker,
    method,
    maxAlerts,
    windowSize,
    windowUnit,
  ];
}
