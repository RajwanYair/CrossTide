---
description: "Use when writing or editing Flutter unit tests, widget tests, or integration tests. Covers test patterns, fixtures, and conventions."
applyTo: "test/**"
---
# Testing Conventions

- Domain tests go in `test/domain/`, named `<class>_test.dart`.
- Helper functions use camelCase (no leading underscores for top-level test helpers).
- Use `const` for immutable test fixtures.
- For database tests: `AppDatabase.forTesting(NativeDatabase.memory())`.
- For provider tests: use `ProviderContainer` with overrides.
- Test names follow pattern: `'<behavior> when <condition>'`.
- Run: `flutter test` (all) or `flutter test test/domain/` (domain only).
