import 'package:equatable/equatable.dart';

/// Market impact model type.
enum MarketImpactModelType {
  /// Almgren-Chriss linear impact model.
  almgrenChriss,

  /// Square-root market impact model.
  squareRoot,

  /// Kyle's Lambda model.
  kyleLambda,
}

/// Estimated market impact of executing a trade order for a given ticker.
class MarketImpactModel extends Equatable {
  const MarketImpactModel({
    required this.ticker,
    required this.modelType,
    required this.orderSizeShares,
    required this.averageDailyVolumeShares,
    required this.participationRatePercent,
    required this.estimatedImpactBps,
    required this.calculatedAt,
    this.spreadBps,
  });

  final String ticker;
  final MarketImpactModelType modelType;

  /// Number of shares in the order.
  final int orderSizeShares;

  final int averageDailyVolumeShares;

  /// Target execution as a percent of ADV.
  final double participationRatePercent;

  /// Estimated price impact in basis points.
  final double estimatedImpactBps;

  final DateTime calculatedAt;

  /// Bid-ask spread contribution in basis points.
  final double? spreadBps;

  MarketImpactModel copyWith({
    String? ticker,
    MarketImpactModelType? modelType,
    int? orderSizeShares,
    int? averageDailyVolumeShares,
    double? participationRatePercent,
    double? estimatedImpactBps,
    DateTime? calculatedAt,
    double? spreadBps,
  }) => MarketImpactModel(
    ticker: ticker ?? this.ticker,
    modelType: modelType ?? this.modelType,
    orderSizeShares: orderSizeShares ?? this.orderSizeShares,
    averageDailyVolumeShares:
        averageDailyVolumeShares ?? this.averageDailyVolumeShares,
    participationRatePercent:
        participationRatePercent ?? this.participationRatePercent,
    estimatedImpactBps: estimatedImpactBps ?? this.estimatedImpactBps,
    calculatedAt: calculatedAt ?? this.calculatedAt,
    spreadBps: spreadBps ?? this.spreadBps,
  );

  @override
  List<Object?> get props => [
    ticker,
    modelType,
    orderSizeShares,
    averageDailyVolumeShares,
    participationRatePercent,
    estimatedImpactBps,
    calculatedAt,
    spreadBps,
  ];
}
