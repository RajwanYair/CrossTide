import 'package:equatable/equatable.dart';

/// Cross-ticker momentum — relative return vs a benchmark ticker.
enum MomentumComparisonBasis { sectorPeer, indexRelative, marketCap, custom }

class CrossTickerMomentum extends Equatable {
  const CrossTickerMomentum({
    required this.ticker,
    required this.benchmarkTicker,
    required this.relativeReturn,
    required this.comparisonBasis,
    required this.isOutperforming,
  });

  final String ticker;
  final String benchmarkTicker;
  final double relativeReturn;
  final MomentumComparisonBasis comparisonBasis;
  final bool isOutperforming;

  CrossTickerMomentum copyWith({
    String? ticker,
    String? benchmarkTicker,
    double? relativeReturn,
    MomentumComparisonBasis? comparisonBasis,
    bool? isOutperforming,
  }) => CrossTickerMomentum(
    ticker: ticker ?? this.ticker,
    benchmarkTicker: benchmarkTicker ?? this.benchmarkTicker,
    relativeReturn: relativeReturn ?? this.relativeReturn,
    comparisonBasis: comparisonBasis ?? this.comparisonBasis,
    isOutperforming: isOutperforming ?? this.isOutperforming,
  );

  @override
  List<Object?> get props => [
    ticker,
    benchmarkTicker,
    relativeReturn,
    comparisonBasis,
    isOutperforming,
  ];
}
