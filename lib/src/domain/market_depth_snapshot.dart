import 'package:equatable/equatable.dart';

/// A single price level in the order book (bid or ask side).
class MarketDepthLevel extends Equatable {
  const MarketDepthLevel({
    required this.price,
    required this.size,
    required this.orderCount,
  }) : assert(price > 0, 'price must be positive'),
       assert(size >= 0, 'size must be non-negative');

  final double price;

  /// Number of shares / contracts at this price level.
  final double size;

  /// Number of resting orders at this price level.
  final int orderCount;

  /// Notional value of this level.
  double get notional => price * size;

  @override
  List<Object?> get props => [price, size, orderCount];
}

/// A point-in-time snapshot of the Level 2 order book for a symbol.
class MarketDepthSnapshot extends Equatable {
  const MarketDepthSnapshot({
    required this.symbol,
    required this.bids,
    required this.asks,
    required this.capturedAt,
  });

  final String symbol;

  /// Bid side sorted descending by price (best bid first).
  final List<MarketDepthLevel> bids;

  /// Ask side sorted ascending by price (best ask first).
  final List<MarketDepthLevel> asks;

  final DateTime capturedAt;

  bool get isEmpty => bids.isEmpty && asks.isEmpty;
  int get bidLevels => bids.length;
  int get askLevels => asks.length;

  /// Best bid price, or `null` if no bids.
  double? get bestBid => bids.isEmpty ? null : bids.first.price;

  /// Best ask price, or `null` if no asks.
  double? get bestAsk => asks.isEmpty ? null : asks.first.price;

  /// Bid–ask spread, or `null` if either side is empty.
  double? get spread {
    final b = bestBid;
    final a = bestAsk;
    if (b == null || a == null) return null;
    return a - b;
  }

  /// Total bid notional across all levels.
  double get totalBidNotional => bids.fold(
    0.0,
    (final double s, final MarketDepthLevel l) => s + l.notional,
  );

  /// Total ask notional across all levels.
  double get totalAskNotional => asks.fold(
    0.0,
    (final double s, final MarketDepthLevel l) => s + l.notional,
  );

  @override
  List<Object?> get props => [symbol, bids, asks, capturedAt];
}
