---
description: "Use when editing CI/CD workflows, GitHub Actions, build configs, or deployment scripts."
applyTo: ".github/workflows/**"
---
# CI/CD Conventions

## Toolchain versions
- Flutter: `channel: stable` / `flutter-version: '3.x'` via `subosito/flutter-action@v2` with `cache: true`.
- Java: **21** (Temurin LTS) — set in `actions/setup-java@v4` with `cache: 'gradle'`. All Android `build.gradle.kts` files must also target `JavaVersion.VERSION_21`.
- Dart SDK is bundled with Flutter; do not install separately.

## Quality gates — zero tolerance
- `flutter analyze --fatal-infos` **must report zero issues** — no errors, no warnings, no infos.
- `dart format --set-exit-if-changed lib test` **must exit 0** — scope to `lib test` only; never run `dart format .` (crashes on stale `build/` paths).
- `flutter test --coverage --timeout 30s` — all tests must pass.
- Domain coverage must be **100%** (enforced by the `awk` script in `ci.yml`).
- Overall project coverage target is **≥ 90%** — do not merge code that drops it below.
- **No `// ignore:` or `// ignore_for_file:` pragmas are permitted.** Fix the underlying issue with a real code change.
- **No `TODO` / `FIXME` / `HACK` comments in production code** — track work in GitHub Issues.

## Code generation
- Runs **once** in the test/analyze job: `dart run build_runner build --delete-conflicting-outputs`.
- Generated `.g.dart` files are uploaded as artifact `generated-code` (retention-days: 1, if-no-files-found: error).
- Build jobs **restore** via `actions/download-artifact@v4` — they must **not** re-run `build_runner`.

## Trigger optimisation
- Every workflow `push`/`pull_request` trigger includes `paths-ignore` for `**.md`, `docs/**`, `.github/ISSUE_TEMPLATE/**`.
- `auto-release.yml` has the same `paths-ignore` so doc-only commits don't advance the release counter.
- `concurrency` with `cancel-in-progress: true` in `ci.yml` cancels superseded PR runs.

## Job structure — `ci.yml`
- `analyze-and-test` (ubuntu, open to push + PR): codegen → upload artifact → analyze → format → test → domain coverage → codecov.
- `dependency-review` (ubuntu, PR only, timeout 5 min): `actions/dependency-review-action@v4`, fail on high severity.
- `build-windows` (windows-latest, PR only, timeout 20 min): restore artifact → `flutter build windows --release` — **no artifact upload** (compile-check only).
- `build-android` (ubuntu, PR only, timeout 15 min): restore artifact → `flutter build apk --debug` — **no artifact upload** (compile-check only).

## Job structure — `release.yml`
- `test` gate (ubuntu, timeout 15 min): codegen → analyze → test → upload artifact.
- `build-windows` (windows-latest, timeout 25 min): restore artifact → build release → zip → upload `windows-release`.
- `build-android` (ubuntu, timeout 20 min): restore artifact → `flutter build apk --release` → rename → upload `android-release`.
- `publish-release` (ubuntu, timeout 5 min): download **by name** (not `merge-multiple`) → create GitHub Release.

## All jobs must have `timeout-minutes`
Every job in every workflow must declare `timeout-minutes`. Defaults: 5 for lightweight jobs (bump, dependency-review, publish), 15–20 for test/Android, 20–25 for Windows builds.

## Artifact hygiene
- Release artifacts (`windows-release`, `android-release`) use `retention-days: 1`.
- `generated-code` artifact is `retention-days: 1`.
- `ci.yml` build jobs produce **no** artifacts — they are throwaway compile checks.
- In `release.yml`, `publish-release` downloads only `windows-release` and `android-release` — never `merge-multiple: true`.
