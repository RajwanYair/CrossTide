import 'package:cross_tide/src/application/accessibility_audit_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = AccessibilityAuditService();

  test('audit returns result for valid components', () {
    final result = service.audit([
      const ComponentDescriptor(
        id: 'btn1',
        type: 'button',
        semanticLabel: 'Submit',
        hasTooltip: true,
        minTapTargetSize: 48.0,
        contrastRatio: 5.0,
      ),
    ]);
    expect(result.totalChecked, 1);
  });

  test('audit flags missing semantic label', () {
    final result = service.audit([
      const ComponentDescriptor(
        id: 'btn2',
        type: 'button',
        semanticLabel: '',
        hasTooltip: false,
        minTapTargetSize: 48.0,
        contrastRatio: 5.0,
      ),
    ]);
    expect(result.totalChecked, 1);
    expect(result.warningCount + result.errorCount, greaterThan(0));
  });

  test('audit handles empty components', () {
    final result = service.audit([]);
    expect(result.totalChecked, 0);
    expect(result.passed, isTrue);
  });
}
