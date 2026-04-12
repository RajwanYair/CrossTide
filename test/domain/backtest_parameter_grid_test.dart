import 'package:cross_tide/src/domain/backtest_parameter_grid.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BacktestParameterGrid', () {
    test('equality', () {
      final a = BacktestParameterGrid(
        gridId: 'g1',
        ticker: 'SPY',
        axes: const [
          GridAxis(parameterName: 'period', testValues: [10, 50, 200]),
        ],
        cells: const [],
        optimalParameters: const {'period': 150.0},
        generatedAt: DateTime(2025, 1, 10),
      );
      final b = BacktestParameterGrid(
        gridId: 'g1',
        ticker: 'SPY',
        axes: const [
          GridAxis(parameterName: 'period', testValues: [10, 50, 200]),
        ],
        cells: const [],
        optimalParameters: const {'period': 150.0},
        generatedAt: DateTime(2025, 1, 10),
      );
      expect(a, b);
    });

    test('copyWith changes ticker', () {
      final base = BacktestParameterGrid(
        gridId: 'g1',
        ticker: 'SPY',
        axes: const [
          GridAxis(parameterName: 'period', testValues: [10, 50, 200]),
        ],
        cells: const [],
        optimalParameters: const {'period': 150.0},
        generatedAt: DateTime(2025, 1, 10),
      );
      final updated = base.copyWith(ticker: 'QQQ');
      expect(updated.ticker, 'QQQ');
    });

    test('props length is 6', () {
      final obj = BacktestParameterGrid(
        gridId: 'g1',
        ticker: 'SPY',
        axes: const [
          GridAxis(parameterName: 'period', testValues: [10, 50, 200]),
        ],
        cells: const [],
        optimalParameters: const {'period': 150.0},
        generatedAt: DateTime(2025, 1, 10),
      );
      expect(obj.props.length, 6);
    });
  });
}
