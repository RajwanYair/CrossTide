import 'package:cross_tide/src/domain/sec_filing_entry.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SecFilingEntry', () {
    test('equality', () {
      final a = SecFilingEntry(
        ticker: 'TSLA',
        filingType: SecFilingType.form10K,
        filingDate: DateTime(2025, 2, 14),
        accessionNumber: '0000320193-25-000001',
        description: 'Annual Report',
      );
      final b = SecFilingEntry(
        ticker: 'TSLA',
        filingType: SecFilingType.form10K,
        filingDate: DateTime(2025, 2, 14),
        accessionNumber: '0000320193-25-000001',
        description: 'Annual Report',
      );
      expect(a, b);
    });

    test('copyWith changes description', () {
      final base = SecFilingEntry(
        ticker: 'TSLA',
        filingType: SecFilingType.form10K,
        filingDate: DateTime(2025, 2, 14),
        accessionNumber: '0000320193-25-000001',
        description: 'Annual Report',
      );
      final updated = base.copyWith(description: 'Form 10-K 2024');
      expect(updated.description, 'Form 10-K 2024');
    });

    test('props length is 7', () {
      final obj = SecFilingEntry(
        ticker: 'TSLA',
        filingType: SecFilingType.form10K,
        filingDate: DateTime(2025, 2, 14),
        accessionNumber: '0000320193-25-000001',
        description: 'Annual Report',
      );
      expect(obj.props.length, 7);
    });
  });
}
