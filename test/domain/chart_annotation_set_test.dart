import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ChartAnnotationType', () {
    test('has 7 values', () {
      expect(ChartAnnotationType.values.length, 7);
    });
  });

  group('ChartAnnotationEntry', () {
    test('hasLabel is true when label is non-empty', () {
      final e = ChartAnnotationEntry(
        annotationId: 'a1',
        annotationType: ChartAnnotationType.textLabel,
        colorHex: '#FF5733',
        createdAt: DateTime(2024, 6, 1),
        label: 'Support',
      );
      expect(e.hasLabel, isTrue);
    });

    test('hasLabel is false when label is null', () {
      final e = ChartAnnotationEntry(
        annotationId: 'a2',
        annotationType: ChartAnnotationType.horizontalLine,
        colorHex: '#0000FF',
        createdAt: DateTime(2024, 6, 1),
      );
      expect(e.hasLabel, isFalse);
    });

    test('hasLabel is false when label is empty string', () {
      final e = ChartAnnotationEntry(
        annotationId: 'a3',
        annotationType: ChartAnnotationType.arrow,
        colorHex: '#FFFFFF',
        createdAt: DateTime(2024, 6, 1),
        label: '',
      );
      expect(e.hasLabel, isFalse);
    });
  });

  group('ChartAnnotationSet', () {
    ChartAnnotationSet buildSet() {
      return ChartAnnotationSet(
        setId: 's1',
        ticker: 'AAPL',
        annotations: [
          ChartAnnotationEntry(
            annotationId: 'h1',
            annotationType: ChartAnnotationType.horizontalLine,
            colorHex: '#00FF00',
            createdAt: DateTime(2024, 6, 1),
          ),
          ChartAnnotationEntry(
            annotationId: 'h2',
            annotationType: ChartAnnotationType.horizontalLine,
            colorHex: '#FF0000',
            createdAt: DateTime(2024, 6, 2),
          ),
          ChartAnnotationEntry(
            annotationId: 't1',
            annotationType: ChartAnnotationType.trendLine,
            colorHex: '#0000FF',
            createdAt: DateTime(2024, 6, 3),
          ),
        ],
        updatedAt: DateTime(2024, 6, 3),
      );
    }

    test('count returns number of annotations', () {
      expect(buildSet().count, 3);
    });

    test('ofType returns only annotations of given type', () {
      final lines = buildSet().ofType(ChartAnnotationType.horizontalLine);
      expect(lines.length, 2);
    });

    test('ofType returns empty for absent type', () {
      final arcs = buildSet().ofType(ChartAnnotationType.arrow);
      expect(arcs, isEmpty);
    });

    test('equality holds for same props', () {
      expect(buildSet(), equals(buildSet()));
    });
  });
}
