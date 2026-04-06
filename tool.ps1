# Stock200Alert Developer CLI
# Usage: .\tool.ps1 <command>
# Commands: setup, generate, analyze, test, format, build, run, clean, health

param(
    [Parameter(Position=0)]
    [ValidateSet('setup', 'generate', 'analyze', 'test', 'format', 'build', 'run', 'clean', 'health')]
    [string]$Command = 'health'
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

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
        Write-Step 'Running tests with coverage'
        flutter test --coverage
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
        Write-Step '5/5 Tests'
        flutter test --coverage
        Write-Host "`nAll health checks passed!" -ForegroundColor Green
    }
}
