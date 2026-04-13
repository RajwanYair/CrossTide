import 'package:cross_tide/src/domain/income_distribution_schedule.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('IncomeDistributionSchedule', () {
    test('equality', () {
      const a = IncomeDistributionSchedule(
        ticker: 'AAPL',
        annualIncomeUsd: 220.0,
        frequency: IncomeFrequency.quarterly,
        nextPaymentDate: '2025-03-15',
        yieldPercent: 0.55,
      );
      const b = IncomeDistributionSchedule(
        ticker: 'AAPL',
        annualIncomeUsd: 220.0,
        frequency: IncomeFrequency.quarterly,
        nextPaymentDate: '2025-03-15',
        yieldPercent: 0.55,
      );
      expect(a, b);
    });

    test('copyWith changes yieldPercent', () {
      const base = IncomeDistributionSchedule(
        ticker: 'AAPL',
        annualIncomeUsd: 220.0,
        frequency: IncomeFrequency.quarterly,
        nextPaymentDate: '2025-03-15',
        yieldPercent: 0.55,
      );
      final updated = base.copyWith(yieldPercent: 0.6);
      expect(updated.yieldPercent, 0.6);
    });

    test('props length is 5', () {
      const obj = IncomeDistributionSchedule(
        ticker: 'AAPL',
        annualIncomeUsd: 220.0,
        frequency: IncomeFrequency.quarterly,
        nextPaymentDate: '2025-03-15',
        yieldPercent: 0.55,
      );
      expect(obj.props.length, 5);
    });
  });
}
