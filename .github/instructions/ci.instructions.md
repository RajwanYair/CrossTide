---
description: "Use when editing CI/CD workflows, GitHub Actions, build configs, or deployment scripts."
applyTo: ".github/workflows/**"
---
# CI/CD Conventions

- All workflows use `subosito/flutter-action@v2` with `channel: stable`.
- Code generation runs before analyze/build: `dart run build_runner build --delete-conflicting-outputs`.
- Analyze step uses `--no-fatal-infos` (infos are non-blocking).
- Format check: `dart format --set-exit-if-changed .`.
- Coverage is collected via `flutter test --coverage`.
- Windows build uses `flutter build windows --release`.
- Android build uses `flutter build apk --debug` (no signing in CI).
