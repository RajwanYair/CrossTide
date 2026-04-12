import 'package:equatable/equatable.dart';

/// A single parameter axis with discrete test values for a grid search.
class GridAxis extends Equatable {
  const GridAxis({required this.parameterName, required this.testValues});

  final String parameterName;
  final List<double> testValues;

  @override
  List<Object?> get props => [parameterName, testValues];
}

/// A single performance measurement cell from a parameter grid search.
class GridCell extends Equatable {
  const GridCell({
    required this.parameters,
    required this.sharpeRatio,
    required this.totalReturnPercent,
    required this.winRatePercent,
  });

  final Map<String, double> parameters;
  final double sharpeRatio;
  final double totalReturnPercent;
  final double winRatePercent;

  @override
  List<Object?> get props => [
    parameters,
    sharpeRatio,
    totalReturnPercent,
    winRatePercent,
  ];
}

/// A multi-dimensional parameter grid search result for a backtest,
/// enumerating all tested parameter combinations and their outcomes.
class BacktestParameterGrid extends Equatable {
  const BacktestParameterGrid({
    required this.gridId,
    required this.ticker,
    required this.axes,
    required this.cells,
    required this.optimalParameters,
    required this.generatedAt,
  });

  final String gridId;
  final String ticker;
  final List<GridAxis> axes;
  final List<GridCell> cells;

  /// Parameter set that produced the best Sharpe ratio.
  final Map<String, double> optimalParameters;

  final DateTime generatedAt;

  BacktestParameterGrid copyWith({
    String? gridId,
    String? ticker,
    List<GridAxis>? axes,
    List<GridCell>? cells,
    Map<String, double>? optimalParameters,
    DateTime? generatedAt,
  }) => BacktestParameterGrid(
    gridId: gridId ?? this.gridId,
    ticker: ticker ?? this.ticker,
    axes: axes ?? this.axes,
    cells: cells ?? this.cells,
    optimalParameters: optimalParameters ?? this.optimalParameters,
    generatedAt: generatedAt ?? this.generatedAt,
  );

  @override
  List<Object?> get props => [
    gridId,
    ticker,
    axes,
    cells,
    optimalParameters,
    generatedAt,
  ];
}
