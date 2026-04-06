---
description: "Generate unit tests for a domain class following project conventions"
agent: "agent"
tools: [read, search, edit, execute]
argument-hint: "Class name or file path to generate tests for"
---
Generate comprehensive unit tests for the specified domain class:

1. Read the source file and understand all public methods
2. Read existing test patterns in `test/domain/` for style reference
3. Create tests covering:
   - Happy path for each public method
   - Edge cases (empty data, insufficient data, boundary values)
   - Business rule enforcement (cross-up rule, idempotency, quiet hours)
4. Use `const` for immutable fixtures, camelCase helpers (no leading underscores)
5. Name tests: `'<behavior> when <condition>'`
6. Run `flutter test` to validate
