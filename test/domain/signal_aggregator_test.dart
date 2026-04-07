import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const aggregator = SignalAggregator();

  MethodSignal makeSignal({
    required bool triggered,
    required AlertType type,
    required String method,
  }) => MethodSignal(
    isTriggered: triggered,
    alertType: type,
    ticker: 'TEST',
    methodName: method,
    evaluatedAt: DateTime(2024, 1, 1),
  );

  group('SignalAggregator', () {
    test('const constructor', () {
      const SignalAggregator Function() create = SignalAggregator.new;
      expect(create(), isNotNull);
    });

    test('empty signals', () {
      final result = aggregator.aggregate(ticker: 'AAPL', signals: []);
      expect(result.buyCount, 0);
      expect(result.sellCount, 0);
      expect(result.bias, 'NEUTRAL');
      expect(result.strength, 0);
    });

    test('counts buys and sells correctly', () {
      final signals = [
        makeSignal(
          triggered: true,
          type: AlertType.michoMethodBuy,
          method: 'Micho',
        ),
        makeSignal(
          triggered: true,
          type: AlertType.rsiMethodBuy,
          method: 'RSI',
        ),
        makeSignal(
          triggered: true,
          type: AlertType.macdMethodSell,
          method: 'MACD',
        ),
        makeSignal(
          triggered: false,
          type: AlertType.bollingerMethodBuy,
          method: 'Bollinger',
        ),
      ];
      final result = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      expect(result.buyCount, 2);
      expect(result.sellCount, 1);
      expect(result.neutralCount, 1);
      expect(result.bias, 'BUY');
      expect(result.buyMethods, ['Micho', 'RSI']);
      expect(result.sellMethods, ['MACD']);
    });

    test('neutral when equal buys and sells', () {
      final signals = [
        makeSignal(
          triggered: true,
          type: AlertType.michoMethodBuy,
          method: 'Micho',
        ),
        makeSignal(
          triggered: true,
          type: AlertType.rsiMethodSell,
          method: 'RSI',
        ),
      ];
      final result = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      expect(result.bias, 'NEUTRAL');
    });

    test('strength calculation', () {
      final signals = [
        makeSignal(
          triggered: true,
          type: AlertType.michoMethodBuy,
          method: 'Micho',
        ),
        makeSignal(
          triggered: true,
          type: AlertType.rsiMethodBuy,
          method: 'RSI',
        ),
        makeSignal(
          triggered: true,
          type: AlertType.macdMethodBuy,
          method: 'MACD',
        ),
        makeSignal(
          triggered: false,
          type: AlertType.bollingerMethodBuy,
          method: 'Bollinger',
        ),
      ];
      final result = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      // 3 buy out of 4 total → 0.75
      expect(result.strength, closeTo(0.75, 0.01));
    });

    test('equatable', () {
      final signals = [
        makeSignal(
          triggered: true,
          type: AlertType.michoMethodBuy,
          method: 'Micho',
        ),
      ];
      final r1 = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      final r2 = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      expect(r1, equals(r2));
    });
  });
}
