---
description: "Generate unit tests for a domain class following project conventions"
agent: "domain-feature"
tools: [read, search, edit, execute]
argument-hint: "Class name or file path to generate tests for"
---
Generate comprehensive unit tests for the specified domain class:

1. Read the source file and understand all public methods
2. Read existing test patterns in `test/domain/` for style reference
3. Reuse `test/helpers/candle_factory.dart` and `test/helpers/signal_factory.dart` when they fit
3. Create tests covering:
   - Happy path for each public method
   - Edge cases (empty data, insufficient data, boundary values)
   - Business rule enforcement (cross-up rule, idempotency, quiet hours)
4. Prefer table-driven tests when multiple cases share the same structure
5. Use `const` for immutable fixtures, camelCase helpers (no leading underscores)
6. Name tests: `'<behavior> when <condition>'`
7. No `// ignore:` pragmas — fix any lint with real code
8. Explicit loop variable types: `for (final MyType x in list)`
9. Run `flutter test --coverage --timeout 30s` to validate
10. Confirm domain coverage remains 100% after additions
