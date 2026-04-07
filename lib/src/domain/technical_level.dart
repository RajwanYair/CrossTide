/// Technical Level — pure domain value object.
///
/// Represents a support or resistance price level for a ticker, computed
/// from historical data (pivot points, Bollinger bands, Fibonacci, etc.).
library;

import 'package:equatable/equatable.dart';

/// Whether the level acts as support or resistance.
enum LevelType {
  /// Price support (floor).
  support,

  /// Price resistance (ceiling).
  resistance;

  /// Human-readable label.
  String get label => switch (this) {
    LevelType.support => 'Support',
    LevelType.resistance => 'Resistance',
  };
}

/// The method used to derive the level.
enum LevelSource {
  /// Classic floor-trader pivot points.
  pivotPoint,

  /// Fibonacci retracement.
  fibonacci,

  /// Bollinger Band boundary.
  bollingerBand,

  /// Donchian channel boundary.
  donchianChannel,

  /// Keltner channel boundary.
  keltnerChannel,

  /// User-defined manual level.
  manual;

  /// Human-readable label.
  String get label => switch (this) {
    LevelSource.pivotPoint => 'Pivot Point',
    LevelSource.fibonacci => 'Fibonacci',
    LevelSource.bollingerBand => 'Bollinger Band',
    LevelSource.donchianChannel => 'Donchian Channel',
    LevelSource.keltnerChannel => 'Keltner Channel',
    LevelSource.manual => 'Manual',
  };
}

/// A computed or user-defined price level.
class TechnicalLevel extends Equatable {
  const TechnicalLevel({
    required this.ticker,
    required this.price,
    required this.levelType,
    required this.source,
    this.label,
    this.computedAt,
  });

  /// Ticker symbol.
  final String ticker;

  /// The price at this level.
  final double price;

  /// Support or resistance.
  final LevelType levelType;

  /// How the level was derived.
  final LevelSource source;

  /// Optional display label (e.g. "S1", "R2", "61.8% Fib").
  final String? label;

  /// When this level was computed.
  final DateTime? computedAt;

  /// User-facing description.
  String get displayLabel =>
      label ?? '${levelType.label} @ ${price.toStringAsFixed(2)}';

  @override
  List<Object?> get props => [
    ticker,
    price,
    levelType,
    source,
    label,
    computedAt,
  ];
}
