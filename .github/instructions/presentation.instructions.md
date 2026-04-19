---
description: "Use when editing Riverpod providers, GoRouter routes, UI screens, or Flutter widgets. Covers state management and presentation patterns."
applyTo: "lib/src/presentation/**"
---
# Presentation Layer Rules

## Architecture
- All providers are in `providers.dart` — single source of truth for DI.
- Use `ref.watch()` in build methods, `ref.read()` for one-shot actions.
- GoRouter handles navigation — routes defined in `router.dart`.
- Notification deep-links use payload format `ticker:SYMBOL`.
- Screens follow the pattern: `ConsumerWidget` or `ConsumerStatefulWidget`.
- Use `domain.` prefix for domain entities to avoid Drift naming conflicts.
- Keep business rules, indicator calculations, and cache logic out of widgets.

## Riverpod Notifier methods
- Do **not** name `Notifier` mutation methods `set` — the `use_setters_to_change_properties` linter requires use of Dart setters for single-assignment patterns, or a descriptive verb (`applyFilter`, `update`, etc.).
- Example: `void applyFilter(String? value) => state = value;` not `void set(String? value) => state = value;`.

## Code quality — zero tolerance
- `flutter analyze --fatal-infos` must report **zero issues** in presentation files.
- **No `// ignore:` or `// ignore_for_file:` pragmas.** Fix the root cause.
- **No `TODO` / `FIXME` / `HACK` comments.** Open a GitHub Issue instead.
- Explicit loop variable types required: `for (final IMarketDataProvider p in list)`.
- `avoid_dynamic_calls` linter is enabled — all call sites must be statically typed; do not suppress with `as dynamic`.
- Workspace-level editor defaults are shared from the parent MyScripts folder; keep local presentation settings truly project-specific.
