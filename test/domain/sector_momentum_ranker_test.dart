import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const ranker = SectorMomentumRanker();

  group('SectorMomentumRanker', () {
    test('rank orders sectors by momentum', () {
      final result = ranker.rank({
        'Tech': [0.05, 0.03, 0.04],
        'Energy': [0.02, 0.01, -0.01],
        'Healthcare': [0.03, 0.02, 0.03],
      });
      expect(result.length, 3);
      expect(result.first.rank, 1);
      expect(result.last.rank, 3);
      // Tech should rank highest (greatest cumulative return)
      expect(result.first.sector, 'Tech');
    });

    test('empty input returns empty', () {
      expect(ranker.rank({}), isEmpty);
    });

    test('relativeStrength above 1 for outperformers', () {
      final result = ranker.rank({
        'A': [0.10, 0.10],
        'B': [0.01, 0.01],
      });
      final sectorA = result.firstWhere((SectorMomentum s) => s.sector == 'A');
      expect(sectorA.relativeStrength, greaterThan(1));
    });

    test('single sector returns rank 1', () {
      final result = ranker.rank({
        'Solo': [0.05],
      });
      expect(result.length, 1);
      expect(result.first.rank, 1);
    });
  });
}
