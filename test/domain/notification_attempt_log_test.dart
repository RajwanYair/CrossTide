import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final t = DateTime(2026, 4, 10, 9, 0);

  group('NotificationAttemptEntry', () {
    test('wasSuccessful is true for delivered outcome', () {
      final entry = NotificationAttemptEntry(
        attemptNumber: 1,
        attemptedAt: t,
        outcome: NotificationAttemptOutcome.delivered,
      );
      expect(entry.wasSuccessful, isTrue);
    });

    test('wasSuccessful is false for failed outcome', () {
      final entry = NotificationAttemptEntry(
        attemptNumber: 1,
        attemptedAt: t,
        outcome: NotificationAttemptOutcome.failed,
        errorMessage: 'timeout',
      );
      expect(entry.wasSuccessful, isFalse);
    });
  });

  group('NotificationAttemptLog', () {
    final scheduled = DateTime(2026, 4, 10, 8, 55);

    test('wasDelivered is true when at least one attempt succeeded', () {
      final log = NotificationAttemptLog(
        notificationId: 'n-1',
        ticker: 'AAPL',
        alertType: 'smaCrossUp200',
        scheduledAt: scheduled,
        attempts: [
          NotificationAttemptEntry(
            attemptNumber: 1,
            attemptedAt: t,
            outcome: NotificationAttemptOutcome.failed,
          ),
          NotificationAttemptEntry(
            attemptNumber: 2,
            attemptedAt: t,
            outcome: NotificationAttemptOutcome.delivered,
          ),
        ],
      );
      expect(log.wasDelivered, isTrue);
      expect(log.totalAttempts, equals(2));
      expect(log.lastAttempt?.attemptNumber, equals(2));
    });

    test('isUndelivered is true when all attempts failed', () {
      final log = NotificationAttemptLog(
        notificationId: 'n-2',
        ticker: 'MSFT',
        alertType: 'rsiOversold',
        scheduledAt: scheduled,
        attempts: [
          NotificationAttemptEntry(
            attemptNumber: 1,
            attemptedAt: t,
            outcome: NotificationAttemptOutcome.failed,
          ),
        ],
      );
      expect(log.isUndelivered, isTrue);
      expect(log.wasDelivered, isFalse);
    });

    test('lastAttempt is null when attempts list is empty', () {
      final log = NotificationAttemptLog(
        notificationId: 'n-3',
        ticker: 'X',
        alertType: 'macdCross',
        scheduledAt: scheduled,
        attempts: const [],
      );
      expect(log.lastAttempt, isNull);
      expect(log.isUndelivered, isFalse);
    });
  });
}
