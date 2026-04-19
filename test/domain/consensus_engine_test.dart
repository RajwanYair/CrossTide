import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/signal_factory.dart';

void main() {
  const engine = ConsensusEngine();

  group('ConsensusEngine', () {
    test('can be constructed at runtime', () {
      const ConsensusEngine Function() create = ConsensusEngine.new;
      final ConsensusResult result = create().evaluate(
        ticker: 'T',
        signals: [],
      );
      expect(result.hasConsensus, isFalse);
    });

    test('no signals → no consensus', () {
      final result = engine.evaluate(ticker: 'AAPL', signals: []);
      expect(result.hasConsensus, isFalse);
      expect(result.buySignal, isNull);
      expect(result.sellSignal, isNull);
      expect(result.buyMethods, isEmpty);
      expect(result.sellMethods, isEmpty);
    });

    test('Micho BUY alone → no consensus (need another method)', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
        ],
      );
      expect(result.hasConsensus, isFalse);
      expect(result.buySignal, isNull);
    });

    test('Micho BUY + RSI BUY → consensus BUY', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.rsiMethodBuy,
            methodName: 'RSI Method',
          ),
        ],
      );
      expect(result.hasConsensus, isTrue);
      expect(result.buySignal, isNotNull);
      expect(result.buySignal!.alertType, AlertType.consensusBuy);
      expect(result.buySignal!.isTriggered, isTrue);
      expect(result.buySignal!.description, contains('Consensus BUY'));
      expect(result.buySignal!.description, contains('1 other'));
    });

    test('Micho BUY + RSI BUY + MACD BUY → consensus BUY (2 others)', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.rsiMethodBuy,
            methodName: 'RSI Method',
          ),
          makeSignal(
            alertType: AlertType.macdMethodBuy,
            methodName: 'MACD Crossover',
          ),
        ],
      );
      expect(result.buySignal!.description, contains('2 other'));
    });

    test('Micho SELL + Bollinger SELL → consensus SELL', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodSell,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.bollingerMethodSell,
            methodName: 'Bollinger Bands',
          ),
        ],
      );
      expect(result.hasConsensus, isTrue);
      expect(result.sellSignal, isNotNull);
      expect(result.sellSignal!.alertType, AlertType.consensusSell);
      expect(result.sellSignal!.description, contains('Consensus SELL'));
    });

    test('RSI BUY alone (no Micho) → no consensus', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.rsiMethodBuy,
            methodName: 'RSI Method',
          ),
        ],
      );
      expect(result.hasConsensus, isFalse);
    });

    test('non-triggered signals are ignored', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
            isTriggered: false,
          ),
          makeSignal(
            alertType: AlertType.rsiMethodBuy,
            methodName: 'RSI Method',
            isTriggered: false,
          ),
        ],
      );
      expect(result.hasConsensus, isFalse);
    });

    test('mixed BUY+SELL: independent consensus for each direction', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.rsiMethodBuy,
            methodName: 'RSI Method',
          ),
          makeSignal(
            alertType: AlertType.michoMethodSell,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.macdMethodSell,
            methodName: 'MACD Crossover',
          ),
        ],
      );
      expect(result.buySignal, isNotNull);
      expect(result.sellSignal, isNotNull);
    });

    test('buyMethods and sellMethods track correctly', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.rsiMethodBuy,
            methodName: 'RSI Method',
          ),
          makeSignal(
            alertType: AlertType.macdMethodBuy,
            methodName: 'MACD Crossover',
          ),
        ],
      );
      expect(result.buyMethods.length, 3);
      expect(result.sellMethods, isEmpty);
    });

    test('ConsensusResult.ticker is set', () {
      final result = engine.evaluate(ticker: 'TSLA', signals: []);
      expect(result.ticker, 'TSLA');
    });

    test('Micho BUY + Stochastic BUY → consensus BUY', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.stochasticMethodBuy,
            methodName: 'Stochastic Method',
          ),
        ],
      );
      expect(result.hasConsensus, isTrue);
      expect(result.buySignal, isNotNull);
    });

    test('Micho SELL + OBV SELL → consensus SELL', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodSell,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.obvMethodSell,
            methodName: 'OBV Divergence',
          ),
        ],
      );
      expect(result.hasConsensus, isTrue);
      expect(result.sellSignal, isNotNull);
    });

    test('Micho BUY + ADX BUY → consensus BUY', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.adxMethodBuy,
            methodName: 'ADX Trend',
          ),
        ],
      );
      expect(result.hasConsensus, isTrue);
      expect(result.buySignal, isNotNull);
    });

    test('Micho BUY + CCI BUY → consensus BUY', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.cciMethodBuy,
            methodName: 'CCI Method',
          ),
        ],
      );
      expect(result.hasConsensus, isTrue);
      expect(result.buySignal, isNotNull);
    });

    test('Micho SELL + SAR SELL → consensus SELL', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodSell,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.sarMethodSell,
            methodName: 'Parabolic SAR',
          ),
        ],
      );
      expect(result.hasConsensus, isTrue);
      expect(result.sellSignal, isNotNull);
    });

    test('all 9 methods BUY → consensus BUY with 8 others', () {
      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: [
          makeSignal(
            alertType: AlertType.michoMethodBuy,
            methodName: 'Micho Method',
          ),
          makeSignal(
            alertType: AlertType.rsiMethodBuy,
            methodName: 'RSI Method',
          ),
          makeSignal(
            alertType: AlertType.macdMethodBuy,
            methodName: 'MACD Crossover',
          ),
          makeSignal(
            alertType: AlertType.bollingerMethodBuy,
            methodName: 'Bollinger Bands',
          ),
          makeSignal(
            alertType: AlertType.stochasticMethodBuy,
            methodName: 'Stochastic',
          ),
          makeSignal(
            alertType: AlertType.obvMethodBuy,
            methodName: 'OBV Divergence',
          ),
          makeSignal(
            alertType: AlertType.adxMethodBuy,
            methodName: 'ADX Trend',
          ),
          makeSignal(
            alertType: AlertType.cciMethodBuy,
            methodName: 'CCI Method',
          ),
          makeSignal(
            alertType: AlertType.sarMethodBuy,
            methodName: 'Parabolic SAR',
          ),
        ],
      );
      expect(result.buySignal, isNotNull);
      expect(result.buySignal!.description, contains('8 other'));
      expect(result.buyMethods.length, 9);
    });
  });
}
