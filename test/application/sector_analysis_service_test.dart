import 'package:cross_tide/src/application/sector_analysis_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = SectorAnalysisService();

  test('analyze returns scores + correlations', () {
    final result = service.analyze(
      sectorReturns: {'Technology': 5.0, 'Energy': -2.0, 'Finance': 1.0},
      sectorDailyReturns: {
        'Technology': [0.5, 0.3, 0.2],
        'Energy': [-0.1, -0.3, 0.1],
        'Finance': [0.1, 0.2, -0.1],
      },
    );
    expect(result, isNotNull);
    expect(result!.scores.length, 3);
    expect(result.correlations, isNotEmpty);
  });

  test('analyze returns null for empty input', () {
    expect(service.analyze(sectorReturns: {}, sectorDailyReturns: {}), isNull);
  });

  test('buildHeatmap returns cells', () {
    final cells = service.buildHeatmap([
      const TickerSectorReturn(
        ticker: 'AAPL',
        sector: 'Technology',
        returnPct: 5.0,
      ),
      const TickerSectorReturn(
        ticker: 'XOM',
        sector: 'Energy',
        returnPct: -2.0,
      ),
    ]);
    expect(cells, isNotEmpty);
  });
}
