import 'package:equatable/equatable.dart';

/// A single ticker entry on the market movers list (top gainers/losers).
class MarketMoverEntry extends Equatable {
  /// Creates a [MarketMoverEntry].
  const MarketMoverEntry({
    required this.ticker,
    required this.changePct,
    required this.close,
    required this.volume,
    required this.rank,
    this.sectorName,
  });

  /// Ticker symbol.
  final String ticker;

  /// Percentage change from prior close (positive = gainer).
  final double changePct;

  /// Most recent close/last price.
  final double close;

  /// Session volume.
  final int volume;

  /// 1-based rank within the movers list.
  final int rank;

  /// Sector name if available.
  final String? sectorName;

  /// Returns `true` when this entry represents a gainer.
  bool get isGainer => changePct > 0;

  /// Returns `true` when this is a big move (|change%| >= 5%).
  bool get isBigMover => changePct.abs() >= 5.0;

  @override
  List<Object?> get props => [
    ticker,
    changePct,
    close,
    volume,
    rank,
    sectorName,
  ];
}
