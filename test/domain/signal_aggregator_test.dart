import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/signal_factory.dart';

void main() {
  const aggregator = SignalAggregator();

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
          isTriggered: true,
          alertType: AlertType.michoMethodBuy,
          methodName: 'Micho',
        ),
        makeSignal(
          isTriggered: true,
          alertType: AlertType.rsiMethodBuy,
          methodName: 'RSI',
        ),
        makeSignal(
          isTriggered: true,
          alertType: AlertType.macdMethodSell,
          methodName: 'MACD',
        ),
        makeSignal(
          isTriggered: false,
          alertType: AlertType.bollingerMethodBuy,
          methodName: 'Bollinger',
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
          isTriggered: true,
          alertType: AlertType.michoMethodBuy,
          methodName: 'Micho',
        ),
        makeSignal(
          isTriggered: true,
          alertType: AlertType.rsiMethodSell,
          methodName: 'RSI',
        ),
      ];
      final result = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      expect(result.bias, 'NEUTRAL');
    });

    test('strength calculation', () {
      final signals = [
        makeSignal(
          isTriggered: true,
          alertType: AlertType.michoMethodBuy,
          methodName: 'Micho',
        ),
        makeSignal(
          isTriggered: true,
          alertType: AlertType.rsiMethodBuy,
          methodName: 'RSI',
        ),
        makeSignal(
          isTriggered: true,
          alertType: AlertType.macdMethodBuy,
          methodName: 'MACD',
        ),
        makeSignal(
          isTriggered: false,
          alertType: AlertType.bollingerMethodBuy,
          methodName: 'Bollinger',
        ),
      ];
      final result = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      // 3 buy out of 4 total → 0.75
      expect(result.strength, closeTo(0.75, 0.01));
    });

    test('equatable', () {
      final signals = [
        makeSignal(
          isTriggered: true,
          alertType: AlertType.michoMethodBuy,
          methodName: 'Micho',
        ),
      ];
      final r1 = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      final r2 = aggregator.aggregate(ticker: 'AAPL', signals: signals);
      expect(r1, equals(r2));
    });
  });
}
