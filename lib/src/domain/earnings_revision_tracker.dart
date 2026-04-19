import 'package:equatable/equatable.dart';

/// Earnings revision tracker — EPS estimate change with direction.
enum EarningsRevisionDirection { up, down, unchanged }

class EarningsRevisionTracker extends Equatable {
  const EarningsRevisionTracker({
    required this.ticker,
    required this.fiscalPeriod,
    required this.previousEps,
    required this.revisedEps,
    required this.direction,
  });

  final String ticker;
  final String fiscalPeriod;
  final double previousEps;
  final double revisedEps;
  final EarningsRevisionDirection direction;

  EarningsRevisionTracker copyWith({
    String? ticker,
    String? fiscalPeriod,
    double? previousEps,
    double? revisedEps,
    EarningsRevisionDirection? direction,
  }) => EarningsRevisionTracker(
    ticker: ticker ?? this.ticker,
    fiscalPeriod: fiscalPeriod ?? this.fiscalPeriod,
    previousEps: previousEps ?? this.previousEps,
    revisedEps: revisedEps ?? this.revisedEps,
    direction: direction ?? this.direction,
  );

  @override
  List<Object?> get props => [
    ticker,
    fiscalPeriod,
    previousEps,
    revisedEps,
    direction,
  ];
}
