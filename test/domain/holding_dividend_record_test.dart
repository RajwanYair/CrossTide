import 'package:cross_tide/src/domain/holding_dividend_record.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('HoldingDividendRecord', () {
    test('equality', () {
      const a = HoldingDividendRecord(
        ticker: 'AAPL',
        exDate: '2025-02-07',
        paymentDate: '2025-02-13',
        amountPerShare: 0.25,
        recordType: DividendRecordType.cash,
      );
      const b = HoldingDividendRecord(
        ticker: 'AAPL',
        exDate: '2025-02-07',
        paymentDate: '2025-02-13',
        amountPerShare: 0.25,
        recordType: DividendRecordType.cash,
      );
      expect(a, b);
    });

    test('copyWith changes amountPerShare', () {
      const base = HoldingDividendRecord(
        ticker: 'AAPL',
        exDate: '2025-02-07',
        paymentDate: '2025-02-13',
        amountPerShare: 0.25,
        recordType: DividendRecordType.cash,
      );
      final updated = base.copyWith(amountPerShare: 0.26);
      expect(updated.amountPerShare, 0.26);
    });

    test('props length is 5', () {
      const obj = HoldingDividendRecord(
        ticker: 'AAPL',
        exDate: '2025-02-07',
        paymentDate: '2025-02-13',
        amountPerShare: 0.25,
        recordType: DividendRecordType.cash,
      );
      expect(obj.props.length, 5);
    });
  });
}
