---
description: "Run full project health check: analyze, test, format, and build"
agent: "agent"
tools: [execute, read, search]
---
Run the complete project health check:

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze
dart format --set-exit-if-changed .
flutter test --coverage
```

Report results for each step. If any step fails, diagnose and suggest fixes.
