import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const builder = AlertTemplateBuilder();

  group('AlertTemplateBuilder', () {
    test('allTemplates returns 4 templates', () {
      final templates = builder.allTemplates();
      expect(templates.length, 4);
    });

    test('conservative has high thresholds', () {
      final t = builder.conservative();
      expect(t.name, 'Conservative');
      expect(t.rsiOversold, 25);
      expect(t.consensusThreshold, 3);
      expect(t.smaPeriods, [200]);
    });

    test('moderate has balanced settings', () {
      final t = builder.moderate();
      expect(t.smaPeriods, [50, 200]);
      expect(t.enabledMethods.length, 4);
    });

    test('aggressive enables many methods', () {
      final t = builder.aggressive();
      expect(t.enabledMethods.length, 6);
      expect(t.consensusThreshold, 2);
    });

    test('scalper is most sensitive', () {
      final t = builder.scalper();
      expect(t.consensusThreshold, 1);
      expect(t.enabledMethods.length, 8);
      expect(t.volumeSpikeMultiplier, 1.2);
    });
  });
}
