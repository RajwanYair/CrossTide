import 'package:cross_tide/src/domain/dividend_cut_alert.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DividendCutAlert', () {
    test('equality', () {
      final a = DividendCutAlert(
        ticker: 'JNJ',
        changeType: DividendChangeType.cut,
        newDividendPerShare: 1.10,
        announcedAt: DateTime(2025, 2, 1),
      );
      final b = DividendCutAlert(
        ticker: 'JNJ',
        changeType: DividendChangeType.cut,
        newDividendPerShare: 1.10,
        announcedAt: DateTime(2025, 2, 1),
      );
      expect(a, b);
    });

    test('copyWith changes newDividendPerShare', () {
      final base = DividendCutAlert(
        ticker: 'JNJ',
        changeType: DividendChangeType.cut,
        newDividendPerShare: 1.10,
        announcedAt: DateTime(2025, 2, 1),
      );
      final updated = base.copyWith(newDividendPerShare: 0.90);
      expect(updated.newDividendPerShare, 0.90);
    });

    test('props length is 7', () {
      final obj = DividendCutAlert(
        ticker: 'JNJ',
        changeType: DividendChangeType.cut,
        newDividendPerShare: 1.10,
        announcedAt: DateTime(2025, 2, 1),
      );
      expect(obj.props.length, 7);
    });
  });
}
