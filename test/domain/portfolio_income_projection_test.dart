import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PortfolioIncomeProjection', () {
    final DateTime start = DateTime(2025, 1, 1);
    final DateTime end = DateTime(2025, 12, 31);
    final DateTime generated = DateTime(2025, 1, 1);

    final PortfolioIncomeProjection projection = PortfolioIncomeProjection(
      entries: [
        IncomeProjectionEntry(
          symbol: 'AAPL',
          amount: 88.0,
          projectedDate: DateTime(2025, 3, 15),
          incomeType: 'dividend',
        ),
        IncomeProjectionEntry(
          symbol: 'MSFT',
          amount: 120.0,
          projectedDate: DateTime(2025, 6, 15),
          incomeType: 'dividend',
        ),
        IncomeProjectionEntry(
          symbol: 'AAPL',
          amount: 200.0,
          projectedDate: DateTime(2025, 4, 1),
          incomeType: 'option_premium',
        ),
      ],
      startDate: start,
      endDate: end,
      generatedAt: generated,
    );

    test('totalProjectedIncome sums all entries', () {
      expect(projection.totalProjectedIncome, closeTo(408.0, 0.001));
    });

    test('dividendIncome sums dividends only', () {
      expect(projection.dividendIncome, closeTo(208.0, 0.001));
    });

    test('optionPremiumIncome sums premiums', () {
      expect(projection.optionPremiumIncome, closeTo(200.0, 0.001));
    });

    test('entryCount returns 3', () {
      expect(projection.entryCount, 3);
    });

    test('isEmpty false', () {
      expect(projection.isEmpty, isFalse);
    });

    test('symbols returns unique ticker list', () {
      expect(projection.symbols.toSet(), {'AAPL', 'MSFT'});
    });

    test('empty projection has zero income', () {
      final PortfolioIncomeProjection empty = PortfolioIncomeProjection(
        entries: const [],
        startDate: start,
        endDate: end,
        generatedAt: generated,
      );
      expect(empty.totalProjectedIncome, 0.0);
      expect(empty.isEmpty, isTrue);
    });
  });
}
