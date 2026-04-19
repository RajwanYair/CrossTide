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

function Invoke-SharedTool {
    param(
        [string]$Action,
        [string]$BumpTypeValue
    )

    $sharedToolPath = Join-Path $PSScriptRoot '..\.vscode\scripts\invoke-flutter-workspace-tool.ps1'
    $arguments = @(
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        $sharedToolPath,
        '-WorkspaceRoot',
        $PSScriptRoot,
        '-Action',
        $Action
    )

    if ($TestTimeoutSeconds -gt 0 -and $Action -in @('test-coverage', 'domain-coverage-check', 'full-health-check')) {
        $arguments += @('-WallClockTimeoutSeconds', $TestTimeoutSeconds)
    }

    if ($BumpTypeValue) {
        $arguments += @('-BumpType', $BumpTypeValue)
    }

    & pwsh @arguments
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

switch ($Command) {
    'setup' {
        Invoke-SharedTool 'pub-get'
        Invoke-SharedTool 'build-runner'
    }
    'generate' {
        Invoke-SharedTool 'build-runner'
    }
    'analyze' {
        Invoke-SharedTool 'analyze'
    }
    'test' {
        Invoke-SharedTool 'test-coverage'
    }
    'format' {
        Invoke-SharedTool 'format'
    }
    'build' {
        Invoke-SharedTool 'build-windows-release'
    }
    'run' {
        Invoke-SharedTool 'run-windows'
    }
    'clean' {
        Invoke-SharedTool 'clean'
    }
    'health' {
        Invoke-SharedTool 'pub-get'
        Invoke-SharedTool 'build-runner'
        Invoke-SharedTool 'full-health-check'
        Invoke-SharedTool 'domain-coverage-check'
    }
}
