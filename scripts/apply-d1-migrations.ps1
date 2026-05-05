#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Provision Cloudflare D1 resources for CrossTide and apply all migrations.

.DESCRIPTION
  Creates the crosstide-db D1 database (if it doesn't exist) and applies all
  pending SQL migrations from worker/migrations/*.sql.

  Run this once per new environment (staging, production).

.PARAMETER Env
  Target environment. Defaults to empty (production).
  Pass "staging" to apply to the staging D1 instance.

.EXAMPLE
  # Apply to production
  .\scripts\apply-d1-migrations.ps1

  # Apply to staging
  .\scripts\apply-d1-migrations.ps1 -Env staging

.NOTES
  Requires:
    - wrangler CLI installed globally or as devDependency (npx wrangler)
    - Authenticated Cloudflare account: npx wrangler login
    - worker/wrangler.toml with [[d1_databases]] binding configured
#>
param(
  [string]$Env = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$WorkerDir = Join-Path $PSScriptRoot ".." "worker"
$MigrationsDir = Join-Path $WorkerDir "migrations"

if (-not (Test-Path $WorkerDir)) {
  Write-Error "worker/ directory not found at $WorkerDir"
  exit 1
}

if (-not (Test-Path $MigrationsDir)) {
  Write-Error "worker/migrations/ directory not found"
  exit 1
}

$MigrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
if ($MigrationFiles.Count -eq 0) {
  Write-Warning "No migration files found in worker/migrations/"
  exit 0
}

Write-Host "Found $($MigrationFiles.Count) migration file(s):" -ForegroundColor Cyan
foreach ($f in $MigrationFiles) {
  Write-Host "  $($f.Name)" -ForegroundColor Gray
}

Push-Location $WorkerDir
try {
  $EnvArgs = if ($Env) { @("--env", $Env) } else { @() }

  # Check current migration status
  Write-Host "`nChecking migration status..." -ForegroundColor Cyan
  $StatusArgs = @("d1", "migrations", "list", "crosstide-db") + $EnvArgs
  & npx wrangler @StatusArgs

  # Apply pending migrations
  Write-Host "`nApplying pending migrations..." -ForegroundColor Cyan
  $ApplyArgs = @("d1", "migrations", "apply", "crosstide-db", "--yes") + $EnvArgs
  & npx wrangler @ApplyArgs

  if ($LASTEXITCODE -ne 0) {
    Write-Error "wrangler d1 migrations apply failed (exit code $LASTEXITCODE)"
    exit 1
  }

  Write-Host "`nMigrations applied successfully." -ForegroundColor Green
} finally {
  Pop-Location
}
