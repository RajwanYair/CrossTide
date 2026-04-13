import 'package:cross_tide/src/domain/market_session_metadata.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketSessionMetadata', () {
    test('equality', () {
      const a = MarketSessionMetadata(
        exchange: 'NYSE',
        sessionDate: '2025-01-02',
        phase: MarketSessionPhase.regular,
        isHalfDay: false,
        isHoliday: false,
      );
      const b = MarketSessionMetadata(
        exchange: 'NYSE',
        sessionDate: '2025-01-02',
        phase: MarketSessionPhase.regular,
        isHalfDay: false,
        isHoliday: false,
      );
      expect(a, b);
    });

    test('copyWith changes isHalfDay', () {
      const base = MarketSessionMetadata(
        exchange: 'NYSE',
        sessionDate: '2025-01-02',
        phase: MarketSessionPhase.regular,
        isHalfDay: false,
        isHoliday: false,
      );
      final updated = base.copyWith(isHalfDay: true);
      expect(updated.isHalfDay, true);
    });

    test('props length is 5', () {
      const obj = MarketSessionMetadata(
        exchange: 'NYSE',
        sessionDate: '2025-01-02',
        phase: MarketSessionPhase.regular,
        isHalfDay: false,
        isHoliday: false,
      );
      expect(obj.props.length, 5);
    });
  });
}
