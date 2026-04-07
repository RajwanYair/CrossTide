import 'package:cross_tide/src/application/alert_rule_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = AlertRuleService();

  const rule = AlertRule(
    name: 'SMA cross',
    conditions: [
      AlertCondition(
        leftVariable: 'sma50',
        op: CompareOp.greaterThan,
        rightVariable: 'sma200',
      ),
    ],
    action: RuleAction.buy,
  );

  const ctx = RuleContext(
    ticker: 'AAPL',
    close: 165.0,
    values: {'sma50': 160.0, 'sma200': 150.0, 'rsi': 45.0},
  );

  test('evaluate returns triggered when condition met', () {
    final result = service.evaluate(rule, ctx);
    expect(result.triggered, isTrue);
    expect(result.ticker, 'AAPL');
  });

  test('evaluate returns not-triggered when condition fails', () {
    const failCtx = RuleContext(
      ticker: 'AAPL',
      close: 145.0,
      values: {'sma50': 140.0, 'sma200': 150.0},
    );
    final result = service.evaluate(rule, failCtx);
    expect(result.triggered, isFalse);
  });

  test('evaluateAll returns only triggered results', () {
    final results = service.evaluateAll([rule], ctx);
    expect(results.length, 1);
    expect(results.first.triggered, isTrue);
  });

  test('scanWatchlist groups triggered rules by ticker', () {
    final results = service.scanWatchlist({'AAPL': ctx}, [rule]);
    expect(results.containsKey('AAPL'), isTrue);
    expect(results['AAPL']!.length, 1);
  });
}
