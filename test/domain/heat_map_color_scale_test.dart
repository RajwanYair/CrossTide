import 'package:cross_tide/src/domain/heat_map_color_scale.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('HeatMapColorScale', () {
    test('equality', () {
      const a = HeatMapColorScale(
        scaleId: 'rdgn',
        name: 'Red-Green',
        stops: [],
      );
      const b = HeatMapColorScale(
        scaleId: 'rdgn',
        name: 'Red-Green',
        stops: [],
      );
      expect(a, b);
    });

    test('copyWith changes name', () {
      const base = HeatMapColorScale(
        scaleId: 'rdgn',
        name: 'Red-Green',
        stops: [],
      );
      final updated = base.copyWith(name: 'Green-Red');
      expect(updated.name, 'Green-Red');
    });

    test('props length is 4', () {
      const obj = HeatMapColorScale(
        scaleId: 'rdgn',
        name: 'Red-Green',
        stops: [],
      );
      expect(obj.props.length, 4);
    });
  });
}
