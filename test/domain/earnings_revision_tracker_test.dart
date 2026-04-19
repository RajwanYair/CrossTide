import 'package:cross_tide/src/domain/earnings_revision_tracker.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('EarningsRevisionTracker', () {
    test('equality', () {
      const a = EarningsRevisionTracker(
        ticker: 'AAPL',
        fiscalPeriod: 'Q1-2025',
        previousEps: 1.80,
        revisedEps: 1.92,
        direction: EarningsRevisionDirection.up,
      );
      const b = EarningsRevisionTracker(
        ticker: 'AAPL',
        fiscalPeriod: 'Q1-2025',
        previousEps: 1.80,
        revisedEps: 1.92,
        direction: EarningsRevisionDirection.up,
      );
      expect(a, b);
    });

    test('copyWith changes revisedEps', () {
      const base = EarningsRevisionTracker(
        ticker: 'AAPL',
        fiscalPeriod: 'Q1-2025',
        previousEps: 1.80,
        revisedEps: 1.92,
        direction: EarningsRevisionDirection.up,
      );
      final updated = base.copyWith(revisedEps: 1.95);
      expect(updated.revisedEps, 1.95);
    });

    test('props length is 5', () {
      const obj = EarningsRevisionTracker(
        ticker: 'AAPL',
        fiscalPeriod: 'Q1-2025',
        previousEps: 1.80,
        revisedEps: 1.92,
        direction: EarningsRevisionDirection.up,
      );
      expect(obj.props.length, 5);
    });
  });
}
