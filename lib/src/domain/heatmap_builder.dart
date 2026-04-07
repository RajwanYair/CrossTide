/// Heatmap Tile — pure domain value object.
///
/// Represents a single tile in a watchlist heatmap, colored by
/// the ticker's distance from its SMA200.
library;

import 'package:equatable/equatable.dart';

/// Color zone for a heatmap tile based on SMA200 distance.
enum HeatmapZone {
  /// Far above SMA200 (> +5%).
  strongBullish,

  /// Moderately above SMA200 (+2% to +5%).
  bullish,

  /// Near SMA200 (±2%).
  neutral,

  /// Moderately below SMA200 (−2% to −5%).
  bearish,

  /// Far below SMA200 (< −5%).
  strongBearish,
}

/// A single tile in the watchlist heatmap.
class HeatmapTile extends Equatable {
  const HeatmapTile({
    required this.symbol,
    required this.distancePct,
    required this.zone,
    this.lastPrice,
    this.sma200,
  });

  /// Ticker symbol.
  final String symbol;

  /// Percentage distance from SMA200 (positive = above).
  final double distancePct;

  /// The color zone derived from distance.
  final HeatmapZone zone;

  /// Last closing price (for display).
  final double? lastPrice;

  /// Current SMA200 value (for display).
  final double? sma200;

  @override
  List<Object?> get props => [symbol, distancePct, zone, lastPrice, sma200];
}

/// Builds heatmap tiles from ticker distance data.
class HeatmapBuilder {
  const HeatmapBuilder({this.strongThreshold = 5.0, this.nearThreshold = 2.0});

  /// % threshold for strong bullish/bearish zone.
  final double strongThreshold;

  /// % threshold for near-SMA neutral zone.
  final double nearThreshold;

  /// Classify a single distance percentage into a zone.
  HeatmapZone classify(double distancePct) {
    if (distancePct > strongThreshold) return HeatmapZone.strongBullish;
    if (distancePct > nearThreshold) return HeatmapZone.bullish;
    if (distancePct >= -nearThreshold) return HeatmapZone.neutral;
    if (distancePct >= -strongThreshold) return HeatmapZone.bearish;
    return HeatmapZone.strongBearish;
  }

  /// Build a heatmap tile for a single ticker.
  HeatmapTile buildTile({
    required String symbol,
    required double distancePct,
    double? lastPrice,
    double? sma200,
  }) => HeatmapTile(
    symbol: symbol,
    distancePct: distancePct,
    zone: classify(distancePct),
    lastPrice: lastPrice,
    sma200: sma200,
  );

  /// Build tiles for multiple tickers, sorted by distance descending.
  List<HeatmapTile> buildAll(Map<String, double> tickerDistances) {
    final List<MapEntry<String, double>> sorted =
        tickerDistances.entries.toList()..sort(
          (MapEntry<String, double> a, MapEntry<String, double> b) =>
              b.value.compareTo(a.value),
        );
    return [
      for (final MapEntry<String, double> e in sorted)
        buildTile(symbol: e.key, distancePct: e.value),
    ];
  }
}
