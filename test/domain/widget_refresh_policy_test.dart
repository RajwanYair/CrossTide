import 'package:cross_tide/src/domain/widget_refresh_policy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('WidgetRefreshPolicy', () {
    test('equality', () {
      const a = WidgetRefreshPolicy(
        widgetId: 'w1',
        trigger: WidgetRefreshTrigger.periodic,
        minIntervalSeconds: 900,
        maxAgeSeconds: 3600,
      );
      const b = WidgetRefreshPolicy(
        widgetId: 'w1',
        trigger: WidgetRefreshTrigger.periodic,
        minIntervalSeconds: 900,
        maxAgeSeconds: 3600,
      );
      expect(a, b);
    });

    test('copyWith changes minIntervalSeconds', () {
      const base = WidgetRefreshPolicy(
        widgetId: 'w1',
        trigger: WidgetRefreshTrigger.periodic,
        minIntervalSeconds: 900,
        maxAgeSeconds: 3600,
      );
      final updated = base.copyWith(minIntervalSeconds: 1800);
      expect(updated.minIntervalSeconds, 1800);
    });

    test('props length is 6', () {
      const obj = WidgetRefreshPolicy(
        widgetId: 'w1',
        trigger: WidgetRefreshTrigger.periodic,
        minIntervalSeconds: 900,
        maxAgeSeconds: 3600,
      );
      expect(obj.props.length, 6);
    });
  });
}
