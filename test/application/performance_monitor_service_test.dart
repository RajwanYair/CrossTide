import 'package:cross_tide/src/application/performance_monitor_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('record and score produces PerformanceScore', () {
    final service = PerformanceMonitorService();
    service.record(
      PerformanceSample(
        operation: 'refresh',
        durationMs: 120,
        timestamp: DateTime(2025, 4, 7),
      ),
    );
    service.record(
      PerformanceSample(
        operation: 'refresh',
        durationMs: 90,
        timestamp: DateTime(2025, 4, 7),
      ),
    );
    service.recordOperation('dataLoad', 50);

    expect(service.sampleCount, 3);
    final score = service.score();
    expect(score, isNotNull);
    expect(score!.overallScore, greaterThanOrEqualTo(0));
  });

  test('score returns null when no samples', () {
    final service = PerformanceMonitorService();
    expect(service.score(), isNull);
  });

  test('reset clears samples', () {
    final service = PerformanceMonitorService();
    service.recordOperation('test', 100);
    expect(service.sampleCount, 1);
    service.reset();
    expect(service.sampleCount, 0);
  });
}
