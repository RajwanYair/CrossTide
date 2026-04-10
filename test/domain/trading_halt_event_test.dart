import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TradingHaltEvent', () {
    late DateTime haltedAt;

    setUp(() => haltedAt = DateTime(2025, 6, 2, 10, 0));

    test('creates active halt', () {
      final event = TradingHaltEvent(
        eventId: 'halt-001',
        symbol: 'GME',
        exchange: 'NYSE',
        reason: TradingHaltReason.volatilityPause,
        haltedAt: haltedAt,
        status: TradingHaltStatus.active,
      );
      expect(event.isActive, isTrue);
      expect(event.hasResumed, isFalse);
      expect(event.haltDuration, isNull);
      expect(event.hasNotes, isFalse);
      expect(event.isMarketWide, isFalse);
    });

    test('resumed halt computes haltDuration', () {
      final resumedAt = haltedAt.add(const Duration(minutes: 15));
      final event = TradingHaltEvent(
        eventId: 'halt-002',
        symbol: 'AMC',
        exchange: 'NYSE',
        reason: TradingHaltReason.circuitBreaker,
        haltedAt: haltedAt,
        status: TradingHaltStatus.resumed,
        resumedAt: resumedAt,
        notes: 'L1 circuit breaker triggered at -7%',
      );
      expect(event.hasResumed, isTrue);
      expect(event.haltDuration, const Duration(minutes: 15));
      expect(event.hasNotes, isTrue);
    });

    test('market-wide halt flag', () {
      final event = TradingHaltEvent(
        eventId: 'halt-003',
        symbol: '',
        exchange: 'NYSE',
        reason: TradingHaltReason.circuitBreaker,
        haltedAt: haltedAt,
        status: TradingHaltStatus.active,
        isMarketWide: true,
      );
      expect(event.isMarketWide, isTrue);
    });

    test('equality holds for identical events', () {
      final a = TradingHaltEvent(
        eventId: 'x',
        symbol: 'X',
        exchange: 'X',
        reason: TradingHaltReason.other,
        haltedAt: haltedAt,
        status: TradingHaltStatus.cancelled,
      );
      final b = TradingHaltEvent(
        eventId: 'x',
        symbol: 'X',
        exchange: 'X',
        reason: TradingHaltReason.other,
        haltedAt: haltedAt,
        status: TradingHaltStatus.cancelled,
      );
      expect(a, equals(b));
    });
  });
}
