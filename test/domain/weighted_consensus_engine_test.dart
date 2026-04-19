import 'package:cross_tide/src/domain/entities.dart';
import 'package:cross_tide/src/domain/weighted_consensus_engine.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/signal_factory.dart';

void main() {
  const engine = WeightedConsensusEngine();
  final now = kTestSignalDate;

  group('WeightedConsensusEngine', () {
    test('BUY consensus when Micho + weighted others meet threshold', () {
      final config = WeightedConsensusConfig.defaultWeights();
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodBuy,
        ),
        makeSignal(methodName: 'RSI Method', alertType: AlertType.rsiMethodBuy),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.hasConsensus, isTrue);
      expect(result.buySignal, isNotNull);
      expect(result.buySignal!.alertType, AlertType.consensusBuy);
      expect(result.buyWeightSum, 1.0);
    });

    test('no BUY consensus when others weight below threshold', () {
      const config = WeightedConsensusConfig(
        weights: [MethodWeight(methodName: 'RSI Method', weight: 0.2)],
        threshold: 0.5,
      );
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodBuy,
        ),
        makeSignal(methodName: 'RSI Method', alertType: AlertType.rsiMethodBuy),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.hasConsensus, isFalse);
      expect(result.buySignal, isNull);
      expect(result.buyWeightSum, 0.2);
    });

    test('no consensus without Micho', () {
      final config = WeightedConsensusConfig.defaultWeights();
      final signals = [
        makeSignal(methodName: 'RSI Method', alertType: AlertType.rsiMethodBuy),
        makeSignal(
          methodName: 'MACD Crossover',
          alertType: AlertType.macdMethodBuy,
        ),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.hasConsensus, isFalse);
    });

    test('SELL consensus with weighted methods', () {
      final config = WeightedConsensusConfig.defaultWeights();
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodSell,
        ),
        makeSignal(
          methodName: 'MACD Crossover',
          alertType: AlertType.macdMethodSell,
        ),
        makeSignal(
          methodName: 'RSI Method',
          alertType: AlertType.rsiMethodSell,
        ),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.hasConsensus, isTrue);
      expect(result.sellSignal, isNotNull);
      expect(result.sellWeightSum, 2.0);
    });

    test('untriggered signals are excluded', () {
      final config = WeightedConsensusConfig.defaultWeights();
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodBuy,
        ),
        makeSignal(
          methodName: 'RSI Method',
          alertType: AlertType.rsiMethodBuy,
          isTriggered: false,
        ),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.hasConsensus, isFalse);
      expect(result.buyWeightSum, 0.0);
    });

    test('disabled method (weight 0) does not contribute', () {
      const config = WeightedConsensusConfig(
        weights: [
          MethodWeight(methodName: 'RSI Method', weight: 0.0),
          MethodWeight(methodName: 'MACD Crossover', weight: 1.0),
        ],
        threshold: 0.5,
      );
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodBuy,
        ),
        makeSignal(methodName: 'RSI Method', alertType: AlertType.rsiMethodBuy),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.hasConsensus, isFalse);
      expect(result.buyWeightSum, 0.0);
    });

    test('unknown method defaults to weight 1.0', () {
      const config = WeightedConsensusConfig(weights: [], threshold: 0.5);
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodBuy,
        ),
        makeSignal(methodName: 'RSI Method', alertType: AlertType.rsiMethodBuy),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.hasConsensus, isTrue);
      expect(result.buyWeightSum, 1.0);
    });

    test('buyConfidence is ratio of weight sum to threshold', () {
      const config = WeightedConsensusConfig(
        weights: [MethodWeight(methodName: 'RSI Method', weight: 0.3)],
        threshold: 1.0,
      );
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodBuy,
        ),
        makeSignal(methodName: 'RSI Method', alertType: AlertType.rsiMethodBuy),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.buyConfidence, closeTo(0.3, 0.001));
    });

    test('sellConfidence clamps to 1.0 when weight exceeds threshold', () {
      const config = WeightedConsensusConfig(
        weights: [
          MethodWeight(methodName: 'RSI Method', weight: 1.0),
          MethodWeight(methodName: 'MACD Crossover', weight: 1.0),
        ],
        threshold: 0.5,
      );
      final signals = [
        makeSignal(
          methodName: 'Micho Method',
          alertType: AlertType.michoMethodSell,
        ),
        makeSignal(
          methodName: 'RSI Method',
          alertType: AlertType.rsiMethodSell,
        ),
        makeSignal(
          methodName: 'MACD Crossover',
          alertType: AlertType.macdMethodSell,
        ),
      ];

      final result = engine.evaluate(
        ticker: 'AAPL',
        signals: signals,
        config: config,
        evaluatedAt: now,
      );

      expect(result.sellConfidence, 1.0);
    });
  });

  group('WeightedConsensusConfig', () {
    test('defaultWeights creates 11 methods with weight 1.0', () {
      final config = WeightedConsensusConfig.defaultWeights();
      expect(config.weights.length, 11);
      for (final MethodWeight w in config.weights) {
        expect(w.weight, 1.0);
        expect(w.isEnabled, isTrue);
      }
      expect(config.threshold, 0.5);
    });

    test('weightFor returns explicit weight', () {
      const config = WeightedConsensusConfig(
        weights: [MethodWeight(methodName: 'RSI Method', weight: 0.7)],
      );
      expect(config.weightFor('RSI Method'), 0.7);
    });

    test('weightFor returns 1.0 for unknown method', () {
      const config = WeightedConsensusConfig(weights: []);
      expect(config.weightFor('Unknown'), 1.0);
    });
  });

  group('MethodWeight', () {
    test('isEnabled is false when weight is 0', () {
      const w = MethodWeight(methodName: 'RSI Method', weight: 0.0);
      expect(w.isEnabled, isFalse);
    });

    test('isEnabled is true when weight is positive', () {
      const w = MethodWeight(methodName: 'RSI Method', weight: 0.1);
      expect(w.isEnabled, isTrue);
    });

    test('equality', () {
      const a = MethodWeight(methodName: 'RSI Method', weight: 0.5);
      const b = MethodWeight(methodName: 'RSI Method', weight: 0.5);
      expect(a, equals(b));
    });
  });
}
