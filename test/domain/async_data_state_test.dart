import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AsyncDataState', () {
    test('hasData returns true when data is present', () {
      const state = AsyncDataState<String>(data: 'hello');
      expect(state.hasData, isTrue);
    });

    test('hasData returns false when data is null', () {
      const state = AsyncDataState<String>();
      expect(state.hasData, isFalse);
    });

    test('hasError returns true when errorMessage is set', () {
      const state = AsyncDataState<int>(errorMessage: 'Network error');
      expect(state.hasError, isTrue);
    });

    test('hasError returns false when errorMessage is null', () {
      const state = AsyncDataState<int>(data: 42);
      expect(state.hasError, isFalse);
    });

    test('isEmpty returns true when no data, not loading, no error', () {
      const state = AsyncDataState<double>();
      expect(state.isEmpty, isTrue);
    });

    test('isEmpty returns false when data is present', () {
      const state = AsyncDataState<double>(data: 3.14);
      expect(state.isEmpty, isFalse);
    });

    test('isEmpty returns false when isLoading is true', () {
      const state = AsyncDataState<double>(isLoading: true);
      expect(state.isEmpty, isFalse);
    });

    test('isEmpty returns false when error is set', () {
      const state = AsyncDataState<double>(errorMessage: 'error');
      expect(state.isEmpty, isFalse);
    });

    test('default isLoading is false', () {
      const state = AsyncDataState<String>();
      expect(state.isLoading, isFalse);
    });

    test('equality holds for same values', () {
      const a = AsyncDataState<String>(data: 'test', isLoading: false);
      const b = AsyncDataState<String>(data: 'test', isLoading: false);
      expect(a, equals(b));
    });

    test('lastUpdatedAt is null by default', () {
      const state = AsyncDataState<String>();
      expect(state.lastUpdatedAt, isNull);
    });
  });
}
