import 'package:cross_tide/src/domain/platform_performance_budget.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PlatformPerformanceBudget', () {
    test('equality', () {
      const a = PlatformPerformanceBudget(
        platformName: 'Android',
        targetFrameTimeMs: 16.6,
        jankThresholdMs: 32.0,
        maxDroppedFramesPerSecond: 3,
        memoryCeilingMb: 512,
        startupTimeBudgetMs: 2000,
      );
      const b = PlatformPerformanceBudget(
        platformName: 'Android',
        targetFrameTimeMs: 16.6,
        jankThresholdMs: 32.0,
        maxDroppedFramesPerSecond: 3,
        memoryCeilingMb: 512,
        startupTimeBudgetMs: 2000,
      );
      expect(a, b);
    });

    test('copyWith changes memoryCeilingMb', () {
      const base = PlatformPerformanceBudget(
        platformName: 'Android',
        targetFrameTimeMs: 16.6,
        jankThresholdMs: 32.0,
        maxDroppedFramesPerSecond: 3,
        memoryCeilingMb: 512,
        startupTimeBudgetMs: 2000,
      );
      final updated = base.copyWith(memoryCeilingMb: 256);
      expect(updated.memoryCeilingMb, 256);
    });

    test('props length is 6', () {
      const obj = PlatformPerformanceBudget(
        platformName: 'Android',
        targetFrameTimeMs: 16.6,
        jankThresholdMs: 32.0,
        maxDroppedFramesPerSecond: 3,
        memoryCeilingMb: 512,
        startupTimeBudgetMs: 2000,
      );
      expect(obj.props.length, 6);
    });
  });
}
