import 'package:equatable/equatable.dart';

/// An alert triggered when the macro regime transitions to a new phase.
class RegimeSwitchAlert extends Equatable {
  const RegimeSwitchAlert({
    required this.alertId,
    required this.previousRegime,
    required this.newRegime,
    required this.confidencePercent,
    required this.triggeredAt,
    this.affectedTickers = const [],
    this.notes,
  });

  final String alertId;

  /// Label of the regime before the switch (e.g. "Goldilocks").
  final String previousRegime;

  /// Label of the new regime (e.g. "Stagflation").
  final String newRegime;

  /// Detection confidence (0–100).
  final double confidencePercent;

  final DateTime triggeredAt;

  /// Tickers in the user's watchlist most affected by this regime switch.
  final List<String> affectedTickers;

  final String? notes;

  RegimeSwitchAlert copyWith({
    String? alertId,
    String? previousRegime,
    String? newRegime,
    double? confidencePercent,
    DateTime? triggeredAt,
    List<String>? affectedTickers,
    String? notes,
  }) => RegimeSwitchAlert(
    alertId: alertId ?? this.alertId,
    previousRegime: previousRegime ?? this.previousRegime,
    newRegime: newRegime ?? this.newRegime,
    confidencePercent: confidencePercent ?? this.confidencePercent,
    triggeredAt: triggeredAt ?? this.triggeredAt,
    affectedTickers: affectedTickers ?? this.affectedTickers,
    notes: notes ?? this.notes,
  );

  @override
  List<Object?> get props => [
    alertId,
    previousRegime,
    newRegime,
    confidencePercent,
    triggeredAt,
    affectedTickers,
    notes,
  ];
}
