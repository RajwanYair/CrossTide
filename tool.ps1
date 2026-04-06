# CrossTide Developer CLI
# Usage: .\tool.ps1 <command>
# Commands: setup, generate, analyze, test, format, build, run, clean, health

param(
    [Parameter(Position=0)]
    [ValidateSet('setup', 'generate', 'analyze', 'test', 'format', 'build', 'run', 'clean', 'health')]
    [string]$Command = 'health',

    # Hard time limit in seconds for the 'test' and 'health' commands.
    # The test process is killed if it exceeds this threshold.
    [int]$TestTimeoutSeconds = 1000
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# Run flutter test with a hard wall-clock kill after $TestTimeoutSeconds.
# Returns the exit code of the flutter process.
function Invoke-TestWithTimeout([int]$LimitSeconds, [string[]]$ExtraArgs = @()) {
    $args = @('test', '--timeout', '30s') + $ExtraArgs
    Write-Host "Running: flutter $($args -join ' ')  [wall-clock limit: ${LimitSeconds}s]" -ForegroundColor DarkGray

    # Start in a child process so we can kill it cleanly.
    $psi = [System.Diagnostics.ProcessStartInfo]::new('flutter', $args)
    $psi.UseShellExecute = $false
    $proc = [System.Diagnostics.Process]::Start($psi)

    $killed = $false
    if (-not $proc.WaitForExit($LimitSeconds * 1000)) {
        $killed = $true
        try { $proc.Kill($true) } catch {}
        Write-Host "`n[ERROR] Test run exceeded ${LimitSeconds}s limit — process killed." -ForegroundColor Red
    }

    $exitCode = $proc.ExitCode
    if ($killed) { exit 1 }
    return $exitCode
}

switch ($Command) {
    'setup' {
        Write-Step 'Installing dependencies'
        flutter pub get
        Write-Step 'Generating code (Drift, Freezed)'
        dart run build_runner build --delete-conflicting-outputs
        Write-Step 'Setup complete'
    }
    'generate' {
        Write-Step 'Generating code'
        dart run build_runner build --delete-conflicting-outputs
    }
    'analyze' {
        Write-Step 'Running static analysis'
        flutter analyze
    }
    'test' {
        Write-Step "Running tests with coverage (wall-clock limit: ${TestTimeoutSeconds}s)"
        $code = Invoke-TestWithTimeout $TestTimeoutSeconds @('--coverage')
        if ($code -ne 0) { exit $code }
    }
    'format' {
        Write-Step 'Formatting code'
        dart format .
    }
    'build' {
        Write-Step 'Building Windows release'
        flutter build windows --release
        Write-Host "`nBuild output: build\windows\x64\runner\Release\" -ForegroundColor Green
    }
    'run' {
        Write-Step 'Running on Windows'
        flutter run -d windows
    }
    'clean' {
        Write-Step 'Cleaning build artifacts'
        flutter clean
        flutter pub get
        dart run build_runner build --delete-conflicting-outputs
        Write-Step 'Clean rebuild complete'
    }
    'health' {
        Write-Step '1/5 Dependencies'
        flutter pub get
        Write-Step '2/5 Code generation'
        dart run build_runner build --delete-conflicting-outputs
        Write-Step '3/5 Static analysis'
        flutter analyze
        Write-Step '4/5 Format check'
        dart format --set-exit-if-changed .
        Write-Step "5/5 Tests (wall-clock limit: ${TestTimeoutSeconds}s)"
        $code = Invoke-TestWithTimeout $TestTimeoutSeconds @('--coverage')
        if ($code -ne 0) { exit $code }
        Write-Host "`nAll health checks passed!" -ForegroundColor Green
    }
}
