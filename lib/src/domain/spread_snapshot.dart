import 'package:equatable/equatable.dart';

/// Bid-ask spread snapshot for a tradeable instrument.
class SpreadSnapshot extends Equatable {
  /// Creates a [SpreadSnapshot].
  const SpreadSnapshot({
    required this.snapshotId,
    required this.ticker,
    required this.capturedAt,
    required this.bidPrice,
    required this.askPrice,
    required this.bidSize,
    required this.askSize,
  });

  /// Unique identifier.
  final String snapshotId;

  /// Ticker symbol.
  final String ticker;

  /// When the snapshot was taken.
  final DateTime capturedAt;

  /// Best bid price.
  final double bidPrice;

  /// Best ask price.
  final double askPrice;

  /// Bid depth at the best level (shares or lots).
  final int bidSize;

  /// Ask depth at the best level (shares or lots).
  final int askSize;

  /// Absolute spread (ask − bid).
  double get spread => askPrice - bidPrice;

  /// Spread expressed in basis points relative to mid price.
  double get spreadBps {
    final double mid = midPrice;
    return mid == 0.0 ? 0.0 : spread / mid * 10000;
  }

  /// Mid price between bid and ask.
  double get midPrice => (bidPrice + askPrice) / 2;

  /// Returns `true` when the spread is ≤ 5 bps (tight market).
  bool get isTight => spreadBps <= 5.0;

  @override
  List<Object?> get props => [
    snapshotId,
    ticker,
    capturedAt,
    bidPrice,
    askPrice,
    bidSize,
    askSize,
  ];
}
