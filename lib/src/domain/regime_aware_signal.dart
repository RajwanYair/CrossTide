import 'package:equatable/equatable.dart';

/// Regime-aware signal — base signal enriched with macro-regime adjustment.
enum RegimeSignalAdjustment { boosted, suppressed, unchanged, vetoed }

class RegimeAwareSignal extends Equatable {
  const RegimeAwareSignal({
    required this.ticker,
    required this.baseSignal,
    required this.regime,
    required this.adjustment,
    required this.adjustedConfidence,
  });

  final String ticker;
  final String baseSignal;
  final String regime;
  final RegimeSignalAdjustment adjustment;
  final double adjustedConfidence;

  RegimeAwareSignal copyWith({
    String? ticker,
    String? baseSignal,
    String? regime,
    RegimeSignalAdjustment? adjustment,
    double? adjustedConfidence,
  }) => RegimeAwareSignal(
    ticker: ticker ?? this.ticker,
    baseSignal: baseSignal ?? this.baseSignal,
    regime: regime ?? this.regime,
    adjustment: adjustment ?? this.adjustment,
    adjustedConfidence: adjustedConfidence ?? this.adjustedConfidence,
  );

  @override
  List<Object?> get props => [
    ticker,
    baseSignal,
    regime,
    adjustment,
    adjustedConfidence,
  ];
}
