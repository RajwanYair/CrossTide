import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertSnoozeConfig', () {
    test('isActiveAt returns true when snoozeUntil is in the future', () {
      final config = AlertSnoozeConfig(
        configId: 'sc1',
        ticker: 'AAPL',
        snoozeUntil: DateTime(2099, 12, 31),
        createdAt: DateTime(2024, 6, 1),
      );
      expect(config.isActiveAt(DateTime(2024, 6, 2)), isTrue);
    });

    test('isActiveAt returns false when snoozeUntil is in the past', () {
      final config = AlertSnoozeConfig(
        configId: 'sc2',
        ticker: 'MSFT',
        snoozeUntil: DateTime(2020, 1, 1),
        createdAt: DateTime(2019, 12, 1),
      );
      expect(config.isActiveAt(DateTime(2024, 6, 1)), isFalse);
    });

    test('isGlobal is true when methodKey is null', () {
      final config = AlertSnoozeConfig(
        configId: 'sc3',
        ticker: 'TSLA',
        snoozeUntil: DateTime(2099, 1, 1),
        createdAt: DateTime(2024, 1, 1),
      );
      expect(config.isGlobal, isTrue);
    });

    test('isGlobal is false when methodKey is set', () {
      final config = AlertSnoozeConfig(
        configId: 'sc4',
        ticker: 'TSLA',
        methodKey: 'rsi',
        snoozeUntil: DateTime(2099, 1, 1),
        createdAt: DateTime(2024, 1, 1),
      );
      expect(config.isGlobal, isFalse);
    });

    test('equality holds for same props', () {
      final a = AlertSnoozeConfig(
        configId: 'sc5',
        ticker: 'NVDA',
        snoozeUntil: DateTime(2025, 1, 1),
        createdAt: DateTime(2024, 1, 1),
        reason: 'Taking a break',
      );
      final b = AlertSnoozeConfig(
        configId: 'sc5',
        ticker: 'NVDA',
        snoozeUntil: DateTime(2025, 1, 1),
        createdAt: DateTime(2024, 1, 1),
        reason: 'Taking a break',
      );
      expect(a, equals(b));
    });
  });
}
