import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('EconomicIndicatorRelease', () {
    late DateTime releaseTime;

    setUp(() => releaseTime = DateTime(2025, 6, 6, 8, 30));

    test('creates unreleased indicator', () {
      final release = EconomicIndicatorRelease(
        releaseId: 'cpi-jan',
        name: 'CPI m/m',
        country: 'US',
        category: EconomicIndicatorCategory.inflation,
        impactLevel: EconomicImpactLevel.high,
        releaseTime: releaseTime,
        previous: 0.3,
        forecast: 0.2,
        unit: '%',
      );
      expect(release.isReleased, isFalse);
      expect(release.isHighImpact, isTrue);
      expect(release.hasForecast, isTrue);
      expect(release.hasPrevious, isTrue);
      expect(release.surprise, isNull);
    });

    test('released indicator computes surprise', () {
      final release = EconomicIndicatorRelease(
        releaseId: 'nfp-feb',
        name: 'Non-Farm Payrolls',
        country: 'US',
        category: EconomicIndicatorCategory.employment,
        impactLevel: EconomicImpactLevel.high,
        releaseTime: releaseTime,
        forecast: 200.0,
        actual: 256.0,
        unit: 'K',
      );
      expect(release.isReleased, isTrue);
      expect(release.surprise, closeTo(56.0, 0.001));
      expect(release.isBeat, isTrue);
    });

    test('miss when actual < forecast', () {
      final release = EconomicIndicatorRelease(
        releaseId: 'gdp-q1',
        name: 'GDP q/q',
        country: 'US',
        category: EconomicIndicatorCategory.growth,
        impactLevel: EconomicImpactLevel.high,
        releaseTime: releaseTime,
        forecast: 2.5,
        actual: 1.8,
        unit: '%',
      );
      expect(release.isBeat, isFalse);
    });

    test('equality holds', () {
      final a = EconomicIndicatorRelease(
        releaseId: 'x',
        name: 'X',
        country: 'US',
        category: EconomicIndicatorCategory.housing,
        impactLevel: EconomicImpactLevel.low,
        releaseTime: releaseTime,
      );
      final b = EconomicIndicatorRelease(
        releaseId: 'x',
        name: 'X',
        country: 'US',
        category: EconomicIndicatorCategory.housing,
        impactLevel: EconomicImpactLevel.low,
        releaseTime: releaseTime,
      );
      expect(a, equals(b));
    });
  });
}
