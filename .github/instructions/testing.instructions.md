---
description: "Use when writing or editing Flutter unit tests, widget tests, or integration tests. Covers test patterns, fixtures, and conventions."
applyTo: "test/**"
---
# Testing Conventions

## File layout
- Domain tests in `test/domain/`, data tests in `test/data/`, application tests in `test/application/`.
- File names: `<class>_test.dart`.

## Style
- Test names follow pattern: `'<behavior> when <condition>'`.
- Helper functions use camelCase — no leading underscores for top-level helpers.
- Use `const` for immutable test fixtures.
- For database tests: `AppDatabase.forTesting(NativeDatabase.memory())`.
- For provider tests: use `ProviderContainer` with overrides.

## Coverage targets
- **Domain layer: 100%** — strictly enforced in CI. A PR that drops domain coverage below 100% fails.
- **Overall project: ≥ 90%** — enforced as a quality expectation; avoid merging code that drops total coverage below this threshold.
- Run with: `flutter test --coverage --timeout 30s`.

## Quality — zero tolerance
- Tests must pass with **zero errors and zero warnings** from `flutter analyze --fatal-infos`.
- **No `// ignore:` pragmas in test files** — fix the lint correctly.
- **No skipped or commented-out tests** unless the corresponding issue is open and linked.

## Commands
- All tests: `flutter test`
- Domain only: `flutter test test/domain/`
- With coverage: `flutter test --coverage --timeout 30s`
