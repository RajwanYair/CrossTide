/// Accessibility Audit Service — application-layer orchestration.
///
/// Wraps [AccessibilityChecker] to audit a set of UI component
/// descriptors and produce a summary with actionable issues.
library;

import '../domain/domain.dart';

/// Orchestrates accessibility auditing for a screen's components.
class AccessibilityAuditService {
  const AccessibilityAuditService({
    AccessibilityChecker checker = const AccessibilityChecker(),
  }) : _checker = checker;

  final AccessibilityChecker _checker;

  /// Audit a list of UI components passing WCAG AA criteria.
  A11yAuditResult audit(List<ComponentDescriptor> components) {
    return _checker.audit(components);
  }
}
