import 'package:equatable/equatable.dart';

/// Order types for a multi-leg options/equities order.
enum MultiLegOrderType {
  bullCallSpread,
  bearPutSpread,
  ironCondor,
  strangle,
  straddle,
  calendarSpread,
  coveredCall,
  protectivePut,
}

/// A single leg within a multi-leg order.
class OrderLeg extends Equatable {
  const OrderLeg({
    required this.symbol,
    required this.quantity,
    required this.isBuy,
    required this.strikePrice,
    required this.expiryDate,
    this.optionType,
  });

  final String symbol;
  final int quantity;
  final bool isBuy;

  /// For options legs: strike price.
  final double strikePrice;

  /// For options legs: expiry date.
  final DateTime expiryDate;

  /// 'call', 'put', or null for equity legs.
  final String? optionType;

  bool get isCall => optionType == 'call';
  bool get isPut => optionType == 'put';

  @override
  List<Object?> get props => [
    symbol,
    quantity,
    isBuy,
    strikePrice,
    expiryDate,
    optionType,
  ];
}

/// Configuration for a multi-leg order strategy.
class MultiLegOrderConfig extends Equatable {
  const MultiLegOrderConfig({
    required this.configId,
    required this.orderType,
    required this.legs,
    required this.maxLoss,
    required this.maxProfit,
  });

  final String configId;
  final MultiLegOrderType orderType;
  final List<OrderLeg> legs;

  /// Maximum potential loss (positive).
  final double maxLoss;

  /// Maximum potential profit (positive; double.infinity for unlimited).
  final double maxProfit;

  int get legCount => legs.length;

  /// Risk-reward ratio: maxProfit / maxLoss. Returns null when maxLoss is 0.
  double? get riskReward => maxLoss > 0 ? maxProfit / maxLoss : null;

  @override
  List<Object?> get props => [configId, orderType, legs, maxLoss, maxProfit];
}
