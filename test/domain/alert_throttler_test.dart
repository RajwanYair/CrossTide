import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const throttler = AlertThrottler();
  final now = DateTime(2025, 4, 7, 12, 0);

  group('AlertThrottler', () {
    test('allows first firing with no history', () {
      final decision = throttler.evaluate(
        ticker: 'AAPL',
        alertType: 'sma200CrossUp',
        history: [],
        now: now,
      );
      expect(decision.allowed, isTrue);
    });

    test('blocks during cooldown', () {
      final recent = AlertFiring(
        ticker: 'AAPL',
        alertType: 'sma200CrossUp',
        firedAt: now.subtract(const Duration(minutes: 30)),
      );
      final decision = throttler.evaluate(
        ticker: 'AAPL',
        alertType: 'sma200CrossUp',
        history: [recent],
        now: now,
      );
      expect(decision.allowed, isFalse);
      expect(decision.cooldownRemaining, isNotNull);
    });

    test('allows after cooldown elapsed', () {
      final old = AlertFiring(
        ticker: 'AAPL',
        alertType: 'sma200CrossUp',
        firedAt: now.subtract(const Duration(hours: 2)),
      );
      final decision = throttler.evaluate(
        ticker: 'AAPL',
        alertType: 'sma200CrossUp',
        history: [old],
        now: now,
      );
      expect(decision.allowed, isTrue);
    });

    test('different alert types are independent', () {
      final recent = AlertFiring(
        ticker: 'AAPL',
        alertType: 'rsiBuy',
        firedAt: now.subtract(const Duration(minutes: 10)),
      );
      final decision = throttler.evaluate(
        ticker: 'AAPL',
        alertType: 'sma200CrossUp',
        history: [recent],
        now: now,
      );
      expect(decision.allowed, isTrue);
    });

    test('evaluateBatch checks multiple alerts', () {
      final decisions = throttler.evaluateBatch(
        requests: [
          (ticker: 'AAPL', alertType: 'buy'),
          (ticker: 'MSFT', alertType: 'buy'),
        ],
        history: [],
        now: now,
      );
      expect(decisions.length, 2);
      expect(decisions['AAPL:buy']!.allowed, isTrue);
    });

    test('custom cooldown works', () {
      final recent = AlertFiring(
        ticker: 'AAPL',
        alertType: 'buy',
        firedAt: now.subtract(const Duration(minutes: 10)),
      );
      final decision = throttler.evaluate(
        ticker: 'AAPL',
        alertType: 'buy',
        history: [recent],
        now: now,
        cooldown: const Duration(minutes: 5),
      );
      expect(decision.allowed, isTrue);
    });
  });
}
