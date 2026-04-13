import 'package:cross_tide/src/domain/extended_trading_session.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ExtendedTradingSession', () {
    test('equality', () {
      const a = ExtendedTradingSession(
        exchange: 'NYSE',
        sessionType: ExtendedSessionType.preMarket,
        openTime: '04:00',
        closeTime: '09:30',
        isActive: true,
      );
      const b = ExtendedTradingSession(
        exchange: 'NYSE',
        sessionType: ExtendedSessionType.preMarket,
        openTime: '04:00',
        closeTime: '09:30',
        isActive: true,
      );
      expect(a, b);
    });

    test('copyWith changes isActive', () {
      const base = ExtendedTradingSession(
        exchange: 'NYSE',
        sessionType: ExtendedSessionType.preMarket,
        openTime: '04:00',
        closeTime: '09:30',
        isActive: true,
      );
      final updated = base.copyWith(isActive: false);
      expect(updated.isActive, false);
    });

    test('props length is 5', () {
      const obj = ExtendedTradingSession(
        exchange: 'NYSE',
        sessionType: ExtendedSessionType.preMarket,
        openTime: '04:00',
        closeTime: '09:30',
        isActive: true,
      );
      expect(obj.props.length, 5);
    });
  });
}
