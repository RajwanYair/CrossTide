/// Candlestick Pattern Detector — pure domain logic.
///
/// Detects common candlestick patterns: Doji, Hammer, Engulfing,
/// Morning Star, Evening Star, etc.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Types of candlestick patterns.
enum CandlestickPatternType {
  doji,
  hammer,
  invertedHammer,
  bullishEngulfing,
  bearishEngulfing,
  morningStar,
  eveningStar,
}

/// A detected candlestick pattern.
class CandlestickPattern extends Equatable {
  const CandlestickPattern({
    required this.type,
    required this.date,
    required this.isBullish,
  });

  final CandlestickPatternType type;
  final DateTime date;
  final bool isBullish;

  @override
  List<Object?> get props => [type, date, isBullish];
}

/// Detects candlestick patterns in candle data.
class CandlestickPatternDetector {
  const CandlestickPatternDetector();

  /// Detect all patterns in [candles]. Candles must be sorted
  /// chronologically (oldest first).
  List<CandlestickPattern> detect(List<DailyCandle> candles) {
    final List<CandlestickPattern> patterns = [];

    for (int i = 0; i < candles.length; i++) {
      final DailyCandle c = candles[i];

      // --- Single-candle patterns ---
      final double body = (c.close - c.open).abs();
      final double range = c.high - c.low;

      if (range > 0) {
        // Doji: body is < 10% of range
        if (body / range < 0.1) {
          patterns.add(
            CandlestickPattern(
              type: CandlestickPatternType.doji,
              date: c.date,
              isBullish: false, // neutral
            ),
          );
        }

        // Hammer: small body at top, long lower shadow
        final double lowerShadow = c.close >= c.open
            ? c.open - c.low
            : c.close - c.low;
        final double upperShadow = c.close >= c.open
            ? c.high - c.close
            : c.high - c.open;
        if (lowerShadow >= body * 2 && upperShadow <= body * 0.5 && body > 0) {
          patterns.add(
            CandlestickPattern(
              type: CandlestickPatternType.hammer,
              date: c.date,
              isBullish: true,
            ),
          );
        }

        // Inverted Hammer: small body at bottom, long upper shadow
        if (upperShadow >= body * 2 && lowerShadow <= body * 0.5 && body > 0) {
          patterns.add(
            CandlestickPattern(
              type: CandlestickPatternType.invertedHammer,
              date: c.date,
              isBullish: true,
            ),
          );
        }
      }

      // --- Two-candle patterns (need previous) ---
      if (i >= 1) {
        final DailyCandle prev = candles[i - 1];

        // Bullish Engulfing: prev red, curr green engulfs prev body
        if (prev.close < prev.open &&
            c.close > c.open &&
            c.open <= prev.close &&
            c.close >= prev.open) {
          patterns.add(
            CandlestickPattern(
              type: CandlestickPatternType.bullishEngulfing,
              date: c.date,
              isBullish: true,
            ),
          );
        }

        // Bearish Engulfing: prev green, curr red engulfs prev body
        if (prev.close > prev.open &&
            c.close < c.open &&
            c.open >= prev.close &&
            c.close <= prev.open) {
          patterns.add(
            CandlestickPattern(
              type: CandlestickPatternType.bearishEngulfing,
              date: c.date,
              isBullish: false,
            ),
          );
        }
      }

      // --- Three-candle patterns (need i-2) ---
      if (i >= 2) {
        final DailyCandle prev2 = candles[i - 2];
        final DailyCandle prev1 = candles[i - 1];

        final double prev1Body = (prev1.close - prev1.open).abs();
        final double prev1Range = prev1.high - prev1.low;

        // Morning Star: big red, small body, big green
        if (prev2.close < prev2.open &&
            prev1Range > 0 &&
            prev1Body / prev1Range < 0.3 &&
            c.close > c.open &&
            c.close > (prev2.open + prev2.close) / 2) {
          patterns.add(
            CandlestickPattern(
              type: CandlestickPatternType.morningStar,
              date: c.date,
              isBullish: true,
            ),
          );
        }

        // Evening Star: big green, small body, big red
        if (prev2.close > prev2.open &&
            prev1Range > 0 &&
            prev1Body / prev1Range < 0.3 &&
            c.close < c.open &&
            c.close < (prev2.open + prev2.close) / 2) {
          patterns.add(
            CandlestickPattern(
              type: CandlestickPatternType.eveningStar,
              date: c.date,
              isBullish: false,
            ),
          );
        }
      }
    }

    return patterns;
  }
}
