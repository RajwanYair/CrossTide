import 'package:cross_tide/src/domain/app_error_catalog.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppErrorCatalog', () {
    test('equality', () {
      const a = AppErrorCatalog(
        errorCode: 'ERR-404',
        message: 'Resource not found',
        severity: AppErrorSeverity.error,
        isRetryable: false,
        category: 'network',
      );
      const b = AppErrorCatalog(
        errorCode: 'ERR-404',
        message: 'Resource not found',
        severity: AppErrorSeverity.error,
        isRetryable: false,
        category: 'network',
      );
      expect(a, b);
    });

    test('copyWith changes isRetryable', () {
      const base = AppErrorCatalog(
        errorCode: 'ERR-404',
        message: 'Resource not found',
        severity: AppErrorSeverity.error,
        isRetryable: false,
        category: 'network',
      );
      final updated = base.copyWith(isRetryable: true);
      expect(updated.isRetryable, true);
    });

    test('props length is 5', () {
      const obj = AppErrorCatalog(
        errorCode: 'ERR-404',
        message: 'Resource not found',
        severity: AppErrorSeverity.error,
        isRetryable: false,
        category: 'network',
      );
      expect(obj.props.length, 5);
    });
  });
}
