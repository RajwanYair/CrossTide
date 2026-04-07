import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const sim = SignalReplaySimulator();

  List<DailyCandle> candles() => [
    DailyCandle(
      date: DateTime(2024, 1, 1),
      open: 100,
      high: 102,
      low: 98,
      close: 100,
      volume: 1000,
    ),
    DailyCandle(
      date: DateTime(2024, 1, 2),
      open: 101,
      high: 103,
      low: 99,
      close: 102,
      volume: 1000,
    ),
    DailyCandle(
      date: DateTime(2024, 1, 3),
      open: 103,
      high: 105,
      low: 101,
      close: 104,
      volume: 1000,
    ),
    DailyCandle(
      date: DateTime(2024, 1, 4),
      open: 104,
      high: 106,
      low: 102,
      close: 99,
      volume: 1000,
    ),
  ];

  MethodSignal signal(DateTime date, AlertType type) => MethodSignal(
    isTriggered: true,
    alertType: type,
    description: 'test',
    evaluatedAt: date,
    ticker: 'TEST',
    methodName: 'test',
  );

  group('SignalReplaySimulator', () {
    test('const constructor', () {
      const SignalReplaySimulator Function() create = SignalReplaySimulator.new;
      expect(create(), isNotNull);
    });

    test('returns null for empty inputs', () {
      expect(sim.simulate(candles: [], signals: []), isNull);
    });

    test('returns null for no complete trades', () {
      // Only buy, no sell
      final result = sim.simulate(
        candles: candles(),
        signals: [signal(DateTime(2024, 1, 1), AlertType.michoMethodBuy)],
      );
      expect(result, isNull);
    });

    test('produces a complete trade', () {
      final result = sim.simulate(
        candles: candles(),
        signals: [
          signal(DateTime(2024, 1, 1), AlertType.michoMethodBuy),
          signal(DateTime(2024, 1, 3), AlertType.michoMethodSell),
        ],
      );
      expect(result, isNotNull);
      expect(result!.trades.length, 1);
      expect(result.trades.first.entryPrice, 100);
      expect(result.trades.first.exitPrice, 104);
      expect(result.trades.first.pnlPercent, closeTo(4.0, 0.01));
      expect(result.winCount, 1);
      expect(result.lossCount, 0);
      expect(result.winRate, 100.0);
    });

    test('losing trade counted correctly', () {
      final result = sim.simulate(
        candles: candles(),
        signals: [
          signal(DateTime(2024, 1, 3), AlertType.michoMethodBuy),
          signal(DateTime(2024, 1, 4), AlertType.michoMethodSell),
        ],
      );
      expect(result, isNotNull);
      expect(result!.trades.first.pnlPercent, lessThan(0));
      expect(result.lossCount, 1);
    });

    test('equatable on ReplayResult', () {
      final r1 = sim.simulate(
        candles: candles(),
        signals: [
          signal(DateTime(2024, 1, 1), AlertType.michoMethodBuy),
          signal(DateTime(2024, 1, 3), AlertType.michoMethodSell),
        ],
      );
      final r2 = sim.simulate(
        candles: candles(),
        signals: [
          signal(DateTime(2024, 1, 1), AlertType.michoMethodBuy),
          signal(DateTime(2024, 1, 3), AlertType.michoMethodSell),
        ],
      );
      expect(r1, equals(r2));
    });
  });
}
