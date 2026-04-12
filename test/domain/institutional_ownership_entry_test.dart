import 'package:cross_tide/src/domain/institutional_ownership_entry.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('InstitutionalOwnershipEntry', () {
    test('equality', () {
      const a = InstitutionalOwnershipEntry(
        ticker: 'AAPL',
        institutionName: 'Vanguard',
        changeDirection: OwnershipChangeDirection.increased,
        currentShares: 1000000,
        reportQuarter: '2025-Q1',
      );
      const b = InstitutionalOwnershipEntry(
        ticker: 'AAPL',
        institutionName: 'Vanguard',
        changeDirection: OwnershipChangeDirection.increased,
        currentShares: 1000000,
        reportQuarter: '2025-Q1',
      );
      expect(a, b);
    });

    test('copyWith changes currentShares', () {
      const base = InstitutionalOwnershipEntry(
        ticker: 'AAPL',
        institutionName: 'Vanguard',
        changeDirection: OwnershipChangeDirection.increased,
        currentShares: 1000000,
        reportQuarter: '2025-Q1',
      );
      final updated = base.copyWith(currentShares: 1100000);
      expect(updated.currentShares, 1100000);
    });

    test('props length is 8', () {
      const obj = InstitutionalOwnershipEntry(
        ticker: 'AAPL',
        institutionName: 'Vanguard',
        changeDirection: OwnershipChangeDirection.increased,
        currentShares: 1000000,
        reportQuarter: '2025-Q1',
      );
      expect(obj.props.length, 8);
    });
  });
}
