import 'package:equatable/equatable.dart';

/// Backtest regime filter — restricts backtest execution to specific market regimes.
enum RegimeFilterMode { allRegimes, bullOnly, bearOnly, sidewaysOnly, custom }

class BacktestRegimeFilter extends Equatable {
  const BacktestRegimeFilter({
    required this.filterId,
    required this.filterMode,
    required this.minConfidence,
    required this.excludeTransitions,
    required this.isEnabled,
  });

  final String filterId;
  final RegimeFilterMode filterMode;
  final double minConfidence;
  final bool excludeTransitions;
  final bool isEnabled;

  BacktestRegimeFilter copyWith({
    String? filterId,
    RegimeFilterMode? filterMode,
    double? minConfidence,
    bool? excludeTransitions,
    bool? isEnabled,
  }) => BacktestRegimeFilter(
    filterId: filterId ?? this.filterId,
    filterMode: filterMode ?? this.filterMode,
    minConfidence: minConfidence ?? this.minConfidence,
    excludeTransitions: excludeTransitions ?? this.excludeTransitions,
    isEnabled: isEnabled ?? this.isEnabled,
  );

  @override
  List<Object?> get props => [
    filterId,
    filterMode,
    minConfidence,
    excludeTransitions,
    isEnabled,
  ];
}
