import 'package:cross_tide/src/domain/entities.dart';

// Re-export DailyCandle so test files don't need a separate entities import.
export 'package:cross_tide/src/domain/entities.dart' show DailyCandle;

/// Base date used across all test candle factories.
final kTestBaseDate = DateTime(2024, 1, 1);

/// Default volume used across test candle factories.
const kDefaultVolume = 1000000;

/// Unified DailyCandle factory for tests.
///
/// Covers all signature variants found across the test suite:
/// - Full OHLC: `makeOhlc(0, open: 99, high: 101, low: 98, close: 100)`
/// - Close-only: `makeOhlc(0, close: 100)` (open defaults to close,
///   high = close + 1, low = close - 1)
/// - With volume: `makeOhlc(0, close: 100, volume: 5000)`
DailyCandle makeOhlc(
  int day, {
  double? open,
  double? high,
  double? low,
  required double close,
  int volume = kDefaultVolume,
}) {
  final double o = open ?? close;
  final double h = high ?? close + 1;
  final double l = low ?? close - 1;
  return DailyCandle(
    date: kTestBaseDate.add(Duration(days: day)),
    open: o,
    high: h,
    low: l,
    close: close,
    volume: volume,
  );
}

/// Generates a list of flat candles at a fixed price.
List<DailyCandle> makeFlat(
  int count, {
  double price = 100,
  int volume = kDefaultVolume,
}) => List.generate(
  count,
  (int i) => makeOhlc(
    i,
    close: price,
    high: price + 1,
    low: price - 1,
    volume: volume,
  ),
);

/// Generates a list of trending candles from [base] stepping by [step].
List<DailyCandle> makeTrending(
  int count, {
  double base = 100,
  double step = 1,
  int volume = kDefaultVolume,
}) => List.generate(count, (int i) {
  final double price = base + i * step;
  return makeOhlc(
    i,
    open: price - step / 2,
    high: price + step,
    low: price - step,
    close: price,
    volume: volume,
  );
});

/// Generates an uptrend from [base] stepping by [step] with
/// OHLC spread (open slightly below close).
List<DailyCandle> makeUptrend(
  int count, {
  double base = 100,
  double step = 2,
  int volume = kDefaultVolume,
}) => List.generate(count, (int i) {
  final double price = base + i * step;
  return makeOhlc(
    i,
    open: price - 0.5,
    high: price + 1,
    low: price - 1,
    close: price,
    volume: volume,
  );
});

/// Generates a downtrend from [base] stepping down by [step].
List<DailyCandle> makeDowntrend(
  int count, {
  double base = 200,
  double step = 2,
  int volume = kDefaultVolume,
}) => List.generate(count, (int i) {
  final double price = base - i * step;
  return makeOhlc(
    i,
    open: price + 0.5,
    high: price + 1,
    low: price - 1,
    close: price,
    volume: volume,
  );
});
