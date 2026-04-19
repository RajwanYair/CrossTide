import 'package:cross_tide/src/domain/consensus_accuracy_tracker.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const tracker = ConsensusAccuracyTracker();

  group('ConsensusAccuracyTracker', () {
    test('empty outcomes returns zero stats', () {
      final stats = tracker.compute([]);
      expect(stats.totalSignals, 0);
      expect(stats.overallHitRate, 0);
      expect(stats.avgReturnPct, 0);
    });

    test('computes hit rate from profitable signals', () {
      final outcomes = [
        ConsensusOutcome(
          ticker: 'AAPL',
          signalDate: DateTime(2026, 1, 1),
          direction: 'BUY',
          entryPrice: 100,
          exitPrice: 110,
          holdingDays: 5,
        ),
        ConsensusOutcome(
          ticker: 'MSFT',
          signalDate: DateTime(2026, 1, 2),
          direction: 'BUY',
          entryPrice: 200,
          exitPrice: 190,
          holdingDays: 3,
        ),
        ConsensusOutcome(
          ticker: 'GOOG',
          signalDate: DateTime(2026, 1, 3),
          direction: 'BUY',
          entryPrice: 150,
          exitPrice: 165,
          holdingDays: 7,
        ),
      ];

      final stats = tracker.compute(outcomes);
      expect(stats.totalSignals, 3);
      expect(stats.profitableSignals, 2);
      expect(stats.overallHitRate, closeTo(0.667, 0.01));
      expect(stats.buyHitRate, closeTo(0.667, 0.01));
    });

    test('computes average return percentage', () {
      final outcomes = [
        ConsensusOutcome(
          ticker: 'AAPL',
          signalDate: DateTime(2026, 1, 1),
          direction: 'BUY',
          entryPrice: 100,
          exitPrice: 110,
          holdingDays: 5,
        ),
        ConsensusOutcome(
          ticker: 'MSFT',
          signalDate: DateTime(2026, 1, 2),
          direction: 'BUY',
          entryPrice: 100,
          exitPrice: 90,
          holdingDays: 5,
        ),
      ];

      final stats = tracker.compute(outcomes);
      expect(stats.avgReturnPct, closeTo(0.0, 0.01));
      expect(stats.avgHoldingDays, 5.0);
    });

    test('SELL signal is profitable when exit < entry', () {
      final outcomes = [
        ConsensusOutcome(
          ticker: 'AAPL',
          signalDate: DateTime(2026, 1, 1),
          direction: 'SELL',
          entryPrice: 100,
          exitPrice: 90,
          holdingDays: 3,
        ),
      ];

      final stats = tracker.compute(outcomes);
      expect(stats.sellHitRate, 1.0);
      expect(stats.profitableSignals, 1);
    });

    test('separates buy and sell hit rates', () {
      final outcomes = [
        ConsensusOutcome(
          ticker: 'AAPL',
          signalDate: DateTime(2026, 1, 1),
          direction: 'BUY',
          entryPrice: 100,
          exitPrice: 110,
          holdingDays: 5,
        ),
        ConsensusOutcome(
          ticker: 'MSFT',
          signalDate: DateTime(2026, 1, 2),
          direction: 'SELL',
          entryPrice: 200,
          exitPrice: 210,
          holdingDays: 3,
        ),
      ];

      final stats = tracker.compute(outcomes);
      expect(stats.buyHitRate, 1.0);
      expect(stats.sellHitRate, 0.0);
    });
  });

  group('ConsensusOutcome', () {
    test('returnPct calculates percentage correctly', () {
      final outcome = ConsensusOutcome(
        ticker: 'AAPL',
        signalDate: DateTime(2026, 1, 1),
        direction: 'BUY',
        entryPrice: 100,
        exitPrice: 115,
        holdingDays: 10,
      );
      expect(outcome.returnPct, 15.0);
    });

    test('returnPct is 0 when entry price is 0', () {
      final outcome = ConsensusOutcome(
        ticker: 'AAPL',
        signalDate: DateTime(2026, 1, 1),
        direction: 'BUY',
        entryPrice: 0,
        exitPrice: 115,
        holdingDays: 10,
      );
      expect(outcome.returnPct, 0);
    });

    test('equality', () {
      final a = ConsensusOutcome(
        ticker: 'AAPL',
        signalDate: DateTime(2026, 1, 1),
        direction: 'BUY',
        entryPrice: 100,
        exitPrice: 110,
        holdingDays: 5,
      );
      final b = ConsensusOutcome(
        ticker: 'AAPL',
        signalDate: DateTime(2026, 1, 1),
        direction: 'BUY',
        entryPrice: 100,
        exitPrice: 110,
        holdingDays: 5,
      );
      expect(a, equals(b));
    });
  });
}
