---
description: "Run the full CrossTide quality gate and report actionable failures"
agent: "agent"
tools: [execute, read, search]
---
Run the complete CrossTide health check in this exact order and report the result of every stage.

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze --fatal-infos
dart format --set-exit-if-changed lib test
flutter test --coverage --timeout 30s
```

Also audit these policy checks:
- no `// ignore:` or `// ignore_for_file:` in `lib/` or `test/`
- no `TODO`, `FIXME`, or `HACK` in `lib/`
- no workflow drift between `.github/workflows/` and `.github/instructions/ci.instructions.md`

Pass criteria:
1. `flutter analyze --fatal-infos` — **zero issues** (zero errors, zero warnings, zero infos)
2. `dart format --set-exit-if-changed lib test` — **exit 0** (no files reformatted)
3. All tests pass with **zero failures**
4. Domain coverage = **100%** — verify with PowerShell domain coverage check
5. Overall coverage **≥ 90%**
6. Generated-code workflow expectations remain coherent if any CI files changed

PowerShell domain coverage check:
```powershell
$c = Get-Content coverage/lcov.info
$in = $false; $u = 0
foreach ($l in $c) {
  if ($l -match '^SF:lib\\src\\domain\\') { $in = $true }
  elseif ($l -eq 'end_of_record') { $in = $false }
  elseif ($in -and $l -match '^DA:\d+,0$') { $u++ }
}
Write-Host "Uncovered domain lines: $u"  # must be 0
```

If anything fails, diagnose the root cause and recommend a real fix. Never suggest a suppress pragma, skipped test, or waived quality gate.
