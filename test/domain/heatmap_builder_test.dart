import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const HeatmapBuilder builder = HeatmapBuilder();

  group('HeatmapBuilder', () {
    test('classify strong bullish above 5%', () {
      expect(builder.classify(6), HeatmapZone.strongBullish);
    });

    test('classify bullish between 2% and 5%', () {
      expect(builder.classify(3), HeatmapZone.bullish);
    });

    test('classify neutral within ±2%', () {
      expect(builder.classify(0), HeatmapZone.neutral);
      expect(builder.classify(1.5), HeatmapZone.neutral);
      expect(builder.classify(-1.5), HeatmapZone.neutral);
    });

    test('classify bearish between -2% and -5%', () {
      expect(builder.classify(-3), HeatmapZone.bearish);
    });

    test('classify strong bearish below -5%', () {
      expect(builder.classify(-6), HeatmapZone.strongBearish);
    });

    test('buildTile creates tile with correct zone', () {
      final HeatmapTile tile = builder.buildTile(
        symbol: 'AAPL',
        distancePct: 8.5,
        lastPrice: 180,
        sma200: 166,
      );
      expect(tile.symbol, 'AAPL');
      expect(tile.zone, HeatmapZone.strongBullish);
      expect(tile.lastPrice, 180);
    });

    test('buildAll sorts by distance descending', () {
      final List<HeatmapTile> tiles = builder.buildAll({
        'AAPL': 5,
        'MSFT': -3,
        'GOOG': 10,
      });
      expect(tiles[0].symbol, 'GOOG');
      expect(tiles[1].symbol, 'AAPL');
      expect(tiles[2].symbol, 'MSFT');
    });

    test('custom thresholds', () {
      const HeatmapBuilder custom = HeatmapBuilder(
        strongThreshold: 10,
        nearThreshold: 3,
      );
      expect(custom.classify(5), HeatmapZone.bullish);
      expect(custom.classify(2), HeatmapZone.neutral);
    });

    test('boundary values', () {
      expect(builder.classify(5.0), HeatmapZone.bullish);
      expect(builder.classify(2.0), HeatmapZone.neutral);
      expect(builder.classify(-2.0), HeatmapZone.neutral);
      expect(builder.classify(-5.0), HeatmapZone.bearish);
    });

    test('HeatmapTile equality', () {
      const HeatmapTile a = HeatmapTile(
        symbol: 'AAPL',
        distancePct: 5,
        zone: HeatmapZone.bullish,
      );
      const HeatmapTile b = HeatmapTile(
        symbol: 'AAPL',
        distancePct: 5,
        zone: HeatmapZone.bullish,
      );
      expect(a, equals(b));
    });
  });
}
