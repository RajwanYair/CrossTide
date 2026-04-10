import 'package:equatable/equatable.dart';

/// Status of a trade plan entry.
enum TradePlanStatus { draft, active, executed, cancelled, expired }

/// A structured trade plan entry with entry/exit/sizing rationale.
class TradePlanEntry extends Equatable {
  const TradePlanEntry({
    required this.id,
    required this.symbol,
    required this.entryPrice,
    required this.stopLoss,
    required this.takeProfit,
    required this.rationale,
    required this.createdAt,
    this.positionSizeShares,
    this.positionSizeUsd,
    this.status = TradePlanStatus.draft,
    this.expiresAt,
    this.executedAt,
  }) : assert(entryPrice > 0, 'entryPrice must be > 0'),
       assert(stopLoss > 0, 'stopLoss must be > 0'),
       assert(takeProfit > 0, 'takeProfit must be > 0'),
       assert(rationale.length >= 5, 'rationale must be at least 5 chars');

  final String id;
  final String symbol;
  final double entryPrice;
  final double stopLoss;
  final double takeProfit;
  final String rationale;
  final DateTime createdAt;
  final int? positionSizeShares;
  final double? positionSizeUsd;
  final TradePlanStatus status;
  final DateTime? expiresAt;
  final DateTime? executedAt;

  /// Risk per share (entry − stop).
  double get riskPerShare => (entryPrice - stopLoss).abs();

  /// Reward per share (target − entry).
  double get rewardPerShare => (takeProfit - entryPrice).abs();

  /// Risk/reward ratio.
  double get riskRewardRatio =>
      riskPerShare == 0 ? 0 : rewardPerShare / riskPerShare;

  bool get isActive => status == TradePlanStatus.active;
  bool get isExecuted => status == TradePlanStatus.executed;
  bool get hasExpiry => expiresAt != null;

  TradePlanEntry activate() => TradePlanEntry(
    id: id,
    symbol: symbol,
    entryPrice: entryPrice,
    stopLoss: stopLoss,
    takeProfit: takeProfit,
    rationale: rationale,
    createdAt: createdAt,
    positionSizeShares: positionSizeShares,
    positionSizeUsd: positionSizeUsd,
    status: TradePlanStatus.active,
    expiresAt: expiresAt,
  );

  TradePlanEntry execute({required DateTime at}) => TradePlanEntry(
    id: id,
    symbol: symbol,
    entryPrice: entryPrice,
    stopLoss: stopLoss,
    takeProfit: takeProfit,
    rationale: rationale,
    createdAt: createdAt,
    positionSizeShares: positionSizeShares,
    positionSizeUsd: positionSizeUsd,
    status: TradePlanStatus.executed,
    expiresAt: expiresAt,
    executedAt: at,
  );

  @override
  List<Object?> get props => [
    id,
    symbol,
    entryPrice,
    stopLoss,
    takeProfit,
    rationale,
    createdAt,
    positionSizeShares,
    positionSizeUsd,
    status,
    expiresAt,
    executedAt,
  ];
}
