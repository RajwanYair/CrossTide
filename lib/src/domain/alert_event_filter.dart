/// Alert Event Filter — filter criteria for the scrollable alert-event log.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Specifies which alert events to include in the log view.
class AlertEventFilter extends Equatable {
  const AlertEventFilter({
    this.ticker,
    this.fromDate,
    this.toDate,
    this.alertTypes = const [],
    this.onlyTriggered = false,
  });

  /// No filters — show all events.
  const AlertEventFilter.all()
      : ticker = null,
        fromDate = null,
        toDate = null,
        alertTypes = const [],
        onlyTriggered = false;

  /// Restrict to a specific ticker symbol (null = all tickers).
  final String? ticker;

  /// Inclusive start of the date range filter (null = no lower bound).
  final DateTime? fromDate;

  /// Inclusive end of the date range filter (null = no upper bound).
  final DateTime? toDate;

  /// Only include events matching one of these [AlertType]s (empty = all types).
  final List<AlertType> alertTypes;

  /// When true, only events where the alert actually fired are included.
  final bool onlyTriggered;

  /// Returns true if any filter is active.
  bool get isFiltered =>
      ticker != null ||
      fromDate != null ||
      toDate != null ||
      alertTypes.isNotEmpty ||
      onlyTriggered;

  /// Returns a copy of this filter with the specified fields replaced.
  AlertEventFilter copyWith({
    String? ticker,
    DateTime? fromDate,
    DateTime? toDate,
    List<AlertType>? alertTypes,
    bool? onlyTriggered,
  }) =>
      AlertEventFilter(
        ticker: ticker ?? this.ticker,
        fromDate: fromDate ?? this.fromDate,
        toDate: toDate ?? this.toDate,
        alertTypes: alertTypes ?? this.alertTypes,
        onlyTriggered: onlyTriggered ?? this.onlyTriggered,
      );

  @override
  List<Object?> get props =>
      [ticker, fromDate, toDate, alertTypes, onlyTriggered];
}
