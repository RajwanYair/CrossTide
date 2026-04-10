import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TradePlanEntry', () {
    final DateTime created = DateTime(2025, 1, 10);

    final TradePlanEntry plan = TradePlanEntry(
      id: 'p1',
      symbol: 'AAPL',
      entryPrice: 200.0,
      stopLoss: 190.0,
      takeProfit: 230.0,
      rationale: 'SMA200 breakout with volume confirmation.',
      createdAt: created,
      positionSizeShares: 50,
    );

    test('riskPerShare computed', () {
      expect(plan.riskPerShare, closeTo(10.0, 0.001));
    });

    test('rewardPerShare computed', () {
      expect(plan.rewardPerShare, closeTo(30.0, 0.001));
    });

    test('riskRewardRatio is 3.0', () {
      expect(plan.riskRewardRatio, closeTo(3.0, 0.001));
    });

    test('status is draft by default', () {
      expect(plan.status, TradePlanStatus.draft);
    });

    test('isActive false for draft', () {
      expect(plan.isActive, isFalse);
    });

    test('activate changes status to active', () {
      final TradePlanEntry active = plan.activate();
      expect(active.isActive, isTrue);
      expect(plan.status, TradePlanStatus.draft);
    });

    test('execute changes status and records time', () {
      final DateTime execTime = DateTime(2025, 1, 11);
      final TradePlanEntry executed = plan.execute(at: execTime);
      expect(executed.isExecuted, isTrue);
      expect(executed.executedAt, execTime);
    });

    test('equality', () {
      final TradePlanEntry same = TradePlanEntry(
        id: 'p1',
        symbol: 'AAPL',
        entryPrice: 200.0,
        stopLoss: 190.0,
        takeProfit: 230.0,
        rationale: 'SMA200 breakout with volume confirmation.',
        createdAt: created,
        positionSizeShares: 50,
      );
      expect(plan, same);
    });
  });
}
