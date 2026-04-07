/// Market Profile Calculator — builds a volume profile (price distribution)
/// showing value area, point of control, and high/low volume nodes.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// A single price level in the volume profile.
class ProfileLevel extends Equatable {
  const ProfileLevel({
    required this.priceLevel,
    required this.volume,
    required this.barCount,
  });

  final double priceLevel;
  final int volume;
  final int barCount;

  @override
  List<Object?> get props => [priceLevel, volume, barCount];
}

/// Result of market profile analysis.
class MarketProfileResult extends Equatable {
  const MarketProfileResult({
    required this.pointOfControl,
    required this.valueAreaHigh,
    required this.valueAreaLow,
    required this.levels,
    required this.totalVolume,
  });

  /// Price level with the highest volume (Point of Control).
  final double pointOfControl;

  /// Upper bound of the value area (70% of volume).
  final double valueAreaHigh;

  /// Lower bound of the value area.
  final double valueAreaLow;

  /// All profile levels.
  final List<ProfileLevel> levels;

  final int totalVolume;

  @override
  List<Object?> get props => [
    pointOfControl,
    valueAreaHigh,
    valueAreaLow,
    levels,
    totalVolume,
  ];
}

/// Builds volume profiles from candle data.
class MarketProfileCalculator {
  const MarketProfileCalculator({this.bucketCount = 30});

  /// Number of price buckets to divide the range into.
  final int bucketCount;

  /// Build a volume profile from candle data.
  MarketProfileResult build(List<DailyCandle> candles) {
    if (candles.isEmpty || bucketCount <= 0) {
      return const MarketProfileResult(
        pointOfControl: 0,
        valueAreaHigh: 0,
        valueAreaLow: 0,
        levels: [],
        totalVolume: 0,
      );
    }

    // Find price range
    var minPrice = candles.first.low;
    var maxPrice = candles.first.high;
    for (final DailyCandle c in candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    final range = maxPrice - minPrice;
    if (range <= 0) {
      return MarketProfileResult(
        pointOfControl: minPrice,
        valueAreaHigh: minPrice,
        valueAreaLow: minPrice,
        levels: [
          ProfileLevel(
            priceLevel: minPrice,
            volume: candles.fold(0, (int s, DailyCandle c) => s + c.volume),
            barCount: candles.length,
          ),
        ],
        totalVolume: candles.fold(0, (int s, DailyCandle c) => s + c.volume),
      );
    }

    final bucketSize = range / bucketCount;
    final volumes = List<int>.filled(bucketCount, 0);
    final barCounts = List<int>.filled(bucketCount, 0);

    // Distribute volume across buckets
    for (final DailyCandle c in candles) {
      final midPrice = (c.high + c.low) / 2;
      var bucket = ((midPrice - minPrice) / bucketSize).floor();
      if (bucket >= bucketCount) bucket = bucketCount - 1;
      if (bucket < 0) bucket = 0;
      volumes[bucket] += c.volume;
      barCounts[bucket]++;
    }

    // Find POC
    var pocBucket = 0;
    for (int i = 1; i < bucketCount; i++) {
      if (volumes[i] > volumes[pocBucket]) pocBucket = i;
    }
    final poc = minPrice + (pocBucket + 0.5) * bucketSize;

    // Value area (70% of total volume)
    final totalVol = volumes.fold(0, (int a, int b) => a + b);
    final targetVol = (totalVol * 0.7).round();
    var vaVol = volumes[pocBucket];
    var vaLow = pocBucket;
    var vaHigh = pocBucket;

    while (vaVol < targetVol) {
      final canExpandUp = vaHigh + 1 < bucketCount;
      final canExpandDown = vaLow - 1 >= 0;

      if (!canExpandUp && !canExpandDown) break;

      final upVol = canExpandUp ? volumes[vaHigh + 1] : -1;
      final downVol = canExpandDown ? volumes[vaLow - 1] : -1;

      if (upVol >= downVol) {
        vaHigh++;
        vaVol += volumes[vaHigh];
      } else {
        vaLow--;
        vaVol += volumes[vaLow];
      }
    }

    final levels = <ProfileLevel>[
      for (int i = 0; i < bucketCount; i++)
        if (volumes[i] > 0)
          ProfileLevel(
            priceLevel: minPrice + (i + 0.5) * bucketSize,
            volume: volumes[i],
            barCount: barCounts[i],
          ),
    ];

    return MarketProfileResult(
      pointOfControl: poc,
      valueAreaHigh: minPrice + (vaHigh + 1) * bucketSize,
      valueAreaLow: minPrice + vaLow * bucketSize,
      levels: levels,
      totalVolume: totalVol,
    );
  }
}
