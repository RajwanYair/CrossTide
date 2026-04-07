---
description: "Run full project health check: analyze, test, format, and build"
agent: "agent"
tools: [execute, read, search]
---
Run the complete project health check in this exact order:

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze --fatal-infos
dart format --set-exit-if-changed lib test
flutter test --coverage --timeout 30s
```

**Pass criteria (all must be true before the check is considered clean):**
1. `flutter analyze --fatal-infos` — **zero issues** (zero errors, zero warnings, zero infos)
2. `dart format --set-exit-if-changed lib test` — **exit 0** (no files reformatted)
3. All tests pass with **zero failures**
4. Domain coverage = **100%** — verify with PowerShell domain coverage check
5. Overall coverage **≥ 90%**
6. **No `// ignore:` pragmas** in `lib/` or `test/` — grep and report any found
7. **No `TODO` / `FIXME` / `HACK`** in `lib/` — grep and report any found

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

Report results for each step. If any step fails, diagnose the root cause and suggest a real code fix — never a suppress pragma or waiver.
