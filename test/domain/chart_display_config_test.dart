import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ChartDisplayConfig', () {
    const ChartDisplayConfig config = ChartDisplayConfig(symbol: 'AAPL');

    test('defaults to line chart', () {
      expect(config.isLineChart, isTrue);
      expect(config.isCandlestick, isFalse);
    });

    test('withLayout returns updated copy', () {
      final ChartDisplayConfig candle = config.withLayout(
        ChartLayoutStyle.candlestick,
      );
      expect(candle.isCandlestick, isTrue);
      expect(config.isLineChart, isTrue);
    });

    test('withSmaOverlay updates overlay', () {
      const SmaOverlayConfig newOverlay = SmaOverlayConfig(
        showSma50: false,
        showSma150: true,
        showSma200: true,
      );
      final ChartDisplayConfig updated = config.withSmaOverlay(newOverlay);
      expect(updated.smaOverlay.showSma150, isTrue);
      expect(config.smaOverlay.showSma150, isFalse);
    });

    test('smaOverlay defaults have sma50 and sma200 on', () {
      expect(config.smaOverlay.showSma50, isTrue);
      expect(config.smaOverlay.showSma200, isTrue);
      expect(config.smaOverlay.showSma150, isFalse);
    });

    test('showVolume true by default', () {
      expect(config.showVolume, isTrue);
    });

    test('equality', () {
      const ChartDisplayConfig same = ChartDisplayConfig(symbol: 'AAPL');
      expect(config, same);
    });
  });

  group('SmaOverlayConfig', () {
    test('hasAnyOverlay true when any overlay on', () {
      const SmaOverlayConfig overlay = SmaOverlayConfig(showSma200: true);
      expect(overlay.hasAnyOverlay, isTrue);
    });

    test('hasAnyOverlay false when all off', () {
      const SmaOverlayConfig overlay = SmaOverlayConfig(
        showSma50: false,
        showSma150: false,
        showSma200: false,
        showEma20: false,
      );
      expect(overlay.hasAnyOverlay, isFalse);
    });
  });
}
