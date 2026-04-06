---
description: "Use when editing Riverpod providers, GoRouter routes, UI screens, or Flutter widgets. Covers state management and presentation patterns."
applyTo: "lib/src/presentation/**"
---
# Presentation Layer Rules

- All providers are in `providers.dart` — single source of truth for DI.
- Use `ref.watch()` in build methods, `ref.read()` for one-shot actions.
- GoRouter handles navigation — routes defined in `router.dart`.
- Notification deep-links use payload format `ticker:SYMBOL`.
- Screens follow the pattern: `ConsumerWidget` or `ConsumerStatefulWidget`.
- Use `domain.` prefix for domain entities to avoid Drift naming conflicts.
