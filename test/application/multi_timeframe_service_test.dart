import 'package:cross_tide/src/application/multi_timeframe_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = MultiTimeframeService();

  final daily = List.generate(
    100,
    (int i) => DailyCandle(
      date: DateTime(2025, 1, 1).add(Duration(days: i)),
      open: 100.0 + i * 0.5,
      high: 101.0 + i * 0.5,
      low: 99.0 + i * 0.5,
      close: 100.5 + i * 0.5,
      volume: 1000000,
    ),
  );

  test('toWeekly aggregates daily candles', () {
    final weekly = service.toWeekly(daily);
    expect(weekly.length, lessThan(daily.length));
    expect(weekly, isNotEmpty);
  });

  test('toMonthly aggregates daily candles', () {
    final monthly = service.toMonthly(daily);
    expect(monthly.length, lessThan(daily.length));
    expect(monthly, isNotEmpty);
  });

  test('analyze returns multi-timeframe result', () {
    final result = service.analyze(
      ticker: 'AAPL',
      dailyCandles: daily,
      biases: const [
        TimeframeBias(
          timeframe: Timeframe.daily,
          bias: 'BUY',
          strength: 0.8,
          signalCount: 3,
        ),
        TimeframeBias(
          timeframe: Timeframe.weekly,
          bias: 'BUY',
          strength: 0.6,
          signalCount: 2,
        ),
      ],
    );
    expect(result.confluenceBias, isNotEmpty);
    expect(result.confluenceScore, greaterThanOrEqualTo(0));
  });
}
