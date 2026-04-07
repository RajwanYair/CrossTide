import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketSession', () {
    test('regular session during trading hours', () {
      final now = DateTime(2024, 6, 17, 10, 30); // Monday 10:30
      final session = MarketSession.nyse(now: now);
      expect(session.phase, SessionPhase.regular);
      expect(session.isOpen, isTrue);
      expect(session.isRegularSession, isTrue);
    });

    test('pre-market before 9:30', () {
      final now = DateTime(2024, 6, 17, 7, 0); // Monday 7:00
      final session = MarketSession.nyse(now: now);
      expect(session.phase, SessionPhase.preMarket);
      expect(session.isOpen, isTrue);
      expect(session.isRegularSession, isFalse);
    });

    test('after-hours between 16:00 and 20:00', () {
      final now = DateTime(2024, 6, 17, 17, 0); // Monday 17:00
      final session = MarketSession.nyse(now: now);
      expect(session.phase, SessionPhase.afterHours);
      expect(session.isOpen, isTrue);
    });

    test('closed after 20:00', () {
      final now = DateTime(2024, 6, 17, 21, 0); // Monday 21:00
      final session = MarketSession.nyse(now: now);
      expect(session.phase, SessionPhase.closed);
      expect(session.isOpen, isFalse);
    });

    test('closed before 4:00', () {
      final now = DateTime(2024, 6, 17, 3, 0); // Monday 3:00
      final session = MarketSession.nyse(now: now);
      expect(session.phase, SessionPhase.closed);
    });

    test('closed on Saturday', () {
      final now = DateTime(2024, 6, 15, 10, 0); // Saturday
      final session = MarketSession.nyse(now: now);
      expect(session.phase, SessionPhase.closed);
    });

    test('closed on Sunday', () {
      final now = DateTime(2024, 6, 16, 10, 0); // Sunday
      final session = MarketSession.nyse(now: now);
      expect(session.phase, SessionPhase.closed);
    });

    test('closed on holiday', () {
      final now = DateTime(2024, 6, 17, 10, 30); // Monday regular time
      final session = MarketSession.nyse(now: now, isHoliday: true);
      expect(session.phase, SessionPhase.closed);
    });

    test('SessionPhase labels', () {
      expect(SessionPhase.preMarket.label, 'Pre-Market');
      expect(SessionPhase.regular.label, 'Regular');
      expect(SessionPhase.afterHours.label, 'After-Hours');
      expect(SessionPhase.closed.label, 'Closed');
    });

    test('equality', () {
      final now = DateTime(2024, 6, 17, 10, 0);
      final s1 = MarketSession.nyse(now: now);
      final s2 = MarketSession.nyse(now: now);
      expect(s1, equals(s2));
    });

    test('exchange is NYSE', () {
      final session = MarketSession.nyse(now: DateTime(2024, 6, 17));
      expect(session.exchange, 'NYSE');
    });
  });
}
