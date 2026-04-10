import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ScreenerFilterStep', () {
    test('equality holds for same props', () {
      const a = ScreenerFilterStep(
        fieldName: 'rsi',
        comparator: '<',
        threshold: 30,
      );
      const b = ScreenerFilterStep(
        fieldName: 'rsi',
        comparator: '<',
        threshold: 30,
      );
      expect(a, equals(b));
    });
  });

  group('ScreenerFilterChain', () {
    const step1 = ScreenerFilterStep(
      fieldName: 'rsi',
      comparator: '<',
      threshold: 30,
    );
    const step2 = ScreenerFilterStep(
      fieldName: 'pctFromSma200',
      comparator: '>',
      threshold: 5,
    );

    const chain = ScreenerFilterChain(
      chainId: 'chain-1',
      label: 'Oversold + Above SMA',
      steps: [step1, step2],
    );

    test('stepCount returns correct count', () {
      expect(chain.stepCount, equals(2));
    });

    test('isEmpty is false for non-empty chain', () {
      expect(chain.isEmpty, isFalse);
    });

    test('isEmpty is true for empty chain', () {
      const empty = ScreenerFilterChain(
        chainId: 'x',
        label: 'empty',
        steps: [],
      );
      expect(empty.isEmpty, isTrue);
    });

    test('withStep appends new step', () {
      const newStep = ScreenerFilterStep(
        fieldName: 'volume',
        comparator: '>',
        threshold: 1000000,
      );
      final updated = chain.withStep(newStep);
      expect(updated.stepCount, equals(3));
      expect(updated.steps.last, equals(newStep));
    });

    test('withOperator returns new chain with updated operator', () {
      final orChain = chain.withOperator(FilterChainOperator.or);
      expect(orChain.operator, equals(FilterChainOperator.or));
      expect(orChain.stepCount, equals(2));
    });

    test('default operator is AND', () {
      expect(chain.operator, equals(FilterChainOperator.and));
    });
  });
}
