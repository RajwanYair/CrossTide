import 'package:equatable/equatable.dart';

/// A single price level on one side of the Level-2 order book.
///
/// Represents either a bid or ask quote at a specific price with
/// cumulative size at that level.
class OrderBookLevel extends Equatable {
  /// Creates an [OrderBookLevel].
  const OrderBookLevel({
    required this.price,
    required this.size,
    required this.side,
  });

  /// Price of this order book level.
  final double price;

  /// Total quantity available at [price].
  final int size;

  /// `true` = bid side; `false` = ask side.
  final bool side;

  /// Returns `true` when this is a bid level.
  bool get isBid => side;

  /// Returns `true` when this is an ask level.
  bool get isAsk => !side;

  /// Notional value of this level (price × size).
  double get notional => price * size;

  @override
  List<Object?> get props => [price, size, side];
}
