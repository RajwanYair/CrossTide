#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Move all shared developer tooling from user/workspace scope to machine-wide scope.

.DESCRIPTION
  CrossTide (and sibling projects) share the same toolchain. This script relocates
  every per-user tool cache and CLI install root to a machine-wide location so that
  a single installation serves every project and every Windows profile:

    npm global prefix   %APPDATA%\npm            -> C:\ProgramData\npm
    npm cache           %LOCALAPPDATA%\npm-cache -> C:\ProgramData\npm-cache
    Playwright browsers %LOCALAPPDATA%\ms-playwright -> C:\ProgramData\ms-playwright

  It then removes the user-scope directories, user-scope environment variables and
  the `prefix`/`cache` keys from %USERPROFILE%\.npmrc so nothing falls back to them.

  Machine-scope CLIs (uv, wrangler, Python) are installed with winget `--scope machine`
  or `npm i -g` (which now resolves to the machine prefix).

  NOTE: project `devDependencies` in node_modules are intentionally left alone. npm
  resolves build tooling (vite, vitest, eslint, tsc) from the local node_modules by
  design; removing them breaks every npm script. Only shared caches and CLI binaries
  are machine-wide.

.PARAMETER Root
  Machine-wide root for relocated tool directories. Default: C:\ProgramData

.PARAMETER SkipInstalls
  Only relocate scopes; do not run winget / npm -g installs.

.PARAMETER WhatIf
  Show what would change without changing anything.

.EXAMPLE
  # Run from an ELEVATED PowerShell (Run as Administrator):
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-machine-tools.ps1

.EXAMPLE
  pwsh -NoProfile -File .\scripts\setup-machine-tools.ps1 -WhatIf

.NOTES
  Requires Administrator. Machine-scope environment variables and writes under
  C:\ProgramData cannot be performed from a normal user session.
  Open a NEW terminal after this script completes so the new PATH is picked up.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [string]$Root = "C:\ProgramData",
  [switch]$SkipInstalls
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Guard: must be elevated ───────────────────────────────────────────────────
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = ([Security.Principal.WindowsPrincipal]$identity).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Error @"
This script must run elevated.

  1. Press Win+X, choose "Terminal (Admin)"
  2. cd '$((Resolve-Path (Join-Path $PSScriptRoot '..')).Path)'
  3. pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-machine-tools.ps1
"@
  exit 1
}

$NpmPrefix = Join-Path $Root "npm"
$NpmCache = Join-Path $Root "npm-cache"
$PwBrowsers = Join-Path $Root "ms-playwright"
$NpmEtc = Join-Path $NpmPrefix "etc"
$NpmGlobalConfig = Join-Path $NpmEtc "npmrc"

function New-SharedDirectory {
  param([Parameter(Mandatory)][string]$Path)

  if (-not (Test-Path $Path)) {
    if ($PSCmdlet.ShouldProcess($Path, "Create machine-wide directory")) {
      New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
  }

  # Grant BUILTIN\Users Modify so non-elevated sessions can write caches.
  if ($PSCmdlet.ShouldProcess($Path, "Grant BUILTIN\Users Modify")) {
    $acl = Get-Acl $Path
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
      "BUILTIN\Users", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.SetAccessRule($rule)
    Set-Acl -Path $Path -AclObject $acl
  }
}

function Move-ScopeContent {
  param(
    [Parameter(Mandatory)][string]$From,
    [Parameter(Mandatory)][string]$To,
    [Parameter(Mandatory)][string]$Label
  )

  if (-not (Test-Path $From)) {
    Write-Host "  $Label - no user-scope copy at $From (nothing to migrate)"
    return
  }

  $items = @(Get-ChildItem -LiteralPath $From -Force -ErrorAction SilentlyContinue)
  if ($items.Count -gt 0) {
    Write-Host "  $Label - migrating $($items.Count) item(s): $From -> $To"
    foreach ($item in $items) {
      $target = Join-Path $To $item.Name
      if (Test-Path $target) { continue }   # machine copy wins
      if ($PSCmdlet.ShouldProcess($item.FullName, "Move to $target")) {
        Move-Item -LiteralPath $item.FullName -Destination $target -Force
      }
    }
  }

  if ($PSCmdlet.ShouldProcess($From, "Remove user-scope directory")) {
    Remove-Item -LiteralPath $From -Recurse -Force -ErrorAction SilentlyContinue
  }
  Write-Host "  $Label - user-scope copy removed"
}

function Move-NpmUserScopeContent {
  param(
    [Parameter(Mandatory)][string]$From,
    [Parameter(Mandatory)][string]$To
  )

  if (-not (Test-Path $From)) {
    Write-Host "  npm global - no user-scope copy at $From (nothing to migrate)"
    return
  }

  $items = @(Get-ChildItem -LiteralPath $From -Force -ErrorAction SilentlyContinue)
  if ($items.Count -eq 0) {
    Write-Host "  npm global - no user-scope items found"
    return
  }

  Write-Host "  npm global - migrating user binaries/modules: $From -> $To"
  foreach ($item in $items) {
    if ($item.Name -eq "etc") {
      # npm may still resolve globalconfig from this path until a new shell picks up machine env vars.
      Write-Host "    preserving $($item.FullName) (npm globalconfig compatibility)"
      continue
    }
    $target = Join-Path $To $item.Name
    if (Test-Path $target) { continue }
    if ($PSCmdlet.ShouldProcess($item.FullName, "Move to $target")) {
      Move-Item -LiteralPath $item.FullName -Destination $target -Force
    }
  }

  Write-Host "  npm global - user binaries/modules migrated; user etc folder preserved"
}

function Initialize-MachineNpmGlobalConfig {
  if (-not (Test-Path $NpmEtc)) {
    if ($PSCmdlet.ShouldProcess($NpmEtc, "Create machine npm etc directory")) {
      New-Item -ItemType Directory -Path $NpmEtc -Force | Out-Null
    }
  }

  if (-not (Test-Path $NpmGlobalConfig)) {
    if ($PSCmdlet.ShouldProcess($NpmGlobalConfig, "Create machine npmrc")) {
      Set-Content -LiteralPath $NpmGlobalConfig -Value @(
        "prefix=$NpmPrefix",
        "cache=$NpmCache"
      ) -Encoding utf8
    }
  }

  Set-MachineEnvironmentVariable -Name "NPM_CONFIG_GLOBALCONFIG" -Value $NpmGlobalConfig
}

function Set-MachineNpmPerformanceDefaults {
  $npmCmd = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
  if (-not (Test-Path $npmCmd)) {
    Write-Warning "npm.cmd not found under Program Files; skipping npm perf defaults."
    return
  }

  # Keep npm fast for repeated invocations across many repos.
  $settings = @(
    @("prefer-offline", "true"),
    @("fund", "false"),
    @("audit", "false"),
    @("progress", "false")
  )

  foreach ($pair in $settings) {
    $key = [string]$pair[0]
    $value = [string]$pair[1]
    if ($PSCmdlet.ShouldProcess("npm global config", "set $key=$value")) {
      & $npmCmd config --global set $key $value | Out-Null
    }
  }
}

function Set-MachineEnvironmentVariable {
  param(
    [Parameter(Mandatory)][string]$Name,
    [Parameter(Mandatory)][string]$Value
  )

  if ($PSCmdlet.ShouldProcess("$Name (Machine)", "Set to $Value")) {
    [Environment]::SetEnvironmentVariable($Name, $Value, "Machine")
  }
  # Clear the user-scope override so it cannot shadow the machine value.
  if ([Environment]::GetEnvironmentVariable($Name, "User")) {
    if ($PSCmdlet.ShouldProcess("$Name (User)", "Remove user-scope override")) {
      [Environment]::SetEnvironmentVariable($Name, $null, "User")
    }
  }
  Set-Item -Path "Env:$Name" -Value $Value
}

function Add-MachinePathEntry {
  param([Parameter(Mandatory)][string]$Entry)

  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $parts = $machinePath -split ';' | Where-Object { $_ }
  if ($parts -contains $Entry) {
    Write-Host "  PATH already contains $Entry"
    return
  }
  if ($PSCmdlet.ShouldProcess("Machine PATH", "Prepend $Entry")) {
    [Environment]::SetEnvironmentVariable("Path", "$Entry;$machinePath", "Machine")
  }
  Write-Host "  PATH += $Entry"
}

function Remove-UserPathEntry {
  param([Parameter(Mandatory)][string]$Entry)

  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $userPath) { return }
  $parts = @($userPath -split ';' | Where-Object { $_ -and $_ -ne $Entry })
  if ($parts.Count -eq (@($userPath -split ';' | Where-Object { $_ }).Count)) { return }
  if ($PSCmdlet.ShouldProcess("User PATH", "Remove $Entry")) {
    [Environment]::SetEnvironmentVariable("Path", ($parts -join ';'), "User")
  }
  Write-Host "  user PATH -= $Entry"
}

function Clear-UserNpmrcScopeKeys {
  $npmrc = Join-Path $env:USERPROFILE ".npmrc"
  if (-not (Test-Path $npmrc)) { return }

  $lines = Get-Content -LiteralPath $npmrc
  $kept = @($lines | Where-Object { $_ -notmatch '^\s*(prefix|cache)\s*=' })
  if ($kept.Count -eq $lines.Count) {
    Write-Host "  ~/.npmrc has no user-scope prefix/cache keys"
    return
  }
  if ($PSCmdlet.ShouldProcess($npmrc, "Strip user-scope prefix/cache keys")) {
    Set-Content -LiteralPath $npmrc -Value $kept -Encoding utf8
  }
  Write-Host "  ~/.npmrc prefix/cache keys removed"
}

# ── 1. Create machine-wide directories ────────────────────────────────────────
Write-Host "`n[1/6] Creating machine-wide tool directories under $Root" -ForegroundColor Cyan
New-SharedDirectory -Path $NpmPrefix
New-SharedDirectory -Path $NpmCache
New-SharedDirectory -Path $PwBrowsers

# ── 2. Migrate user-scope content ─────────────────────────────────────────────
Write-Host "`n[2/6] Migrating user-scope tool data to machine scope" -ForegroundColor Cyan
Move-NpmUserScopeContent -From (Join-Path $env:APPDATA "npm") -To $NpmPrefix
Move-ScopeContent -From (Join-Path $env:LOCALAPPDATA "npm-cache") -To $NpmCache -Label "npm cache"
Move-ScopeContent -From (Join-Path $env:LOCALAPPDATA "ms-playwright") -To $PwBrowsers -Label "playwright browsers"

# ── 3. Machine environment variables ──────────────────────────────────────────
Write-Host "`n[3/6] Setting machine-scope environment variables" -ForegroundColor Cyan
Set-MachineEnvironmentVariable -Name "NPM_CONFIG_PREFIX" -Value $NpmPrefix
Set-MachineEnvironmentVariable -Name "NPM_CONFIG_CACHE" -Value $NpmCache
Set-MachineEnvironmentVariable -Name "PLAYWRIGHT_BROWSERS_PATH" -Value $PwBrowsers
Initialize-MachineNpmGlobalConfig
Set-MachineNpmPerformanceDefaults

Add-MachinePathEntry -Entry $NpmPrefix
Remove-UserPathEntry -Entry (Join-Path $env:APPDATA "npm")

# ── 4. Strip user-scope npm config ────────────────────────────────────────────
Write-Host "`n[4/6] Cleaning user-scope npm config" -ForegroundColor Cyan
Clear-UserNpmrcScopeKeys

# ── 5. Machine-scope CLI installs ─────────────────────────────────────────────
if ($SkipInstalls) {
  Write-Host "`n[5/6] -SkipInstalls specified; skipping CLI installs" -ForegroundColor Yellow
}
else {
  Write-Host "`n[5/6] Installing shared CLIs at machine scope" -ForegroundColor Cyan

  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    # --scope machine keeps these out of the user profile.
    $wingetIds = @(
      "Python.Python.3.13",
      "astral-sh.uv",
      "Git.Git",
      "GitHub.cli",
      "OpenJS.NodeJS.LTS"
    )
    foreach ($id in $wingetIds) {
      if ($PSCmdlet.ShouldProcess($id, "winget install --scope machine")) {
        Write-Host "  winget: $id"
        & winget install --id $id --scope machine --exact `
          --accept-package-agreements --accept-source-agreements `
          --disable-interactivity 2>&1 | Out-String | Write-Verbose
      }
    }
  }
  else {
    Write-Warning "winget not found; skipping OS-level package installs."
  }

  # npm -g now resolves to $NpmPrefix (machine scope).
  $npmGlobals = @("wrangler", "@biomejs/biome", "tsx", "markdownlint-cli2", "@playwright/mcp")
  foreach ($pkg in $npmGlobals) {
    if ($PSCmdlet.ShouldProcess($pkg, "npm install -g")) {
      Write-Host "  npm -g: $pkg"
      & npm install -g --prefix $NpmPrefix $pkg 2>&1 | Out-String | Write-Verbose
    }
  }

  # Playwright browsers land in $PwBrowsers because PLAYWRIGHT_BROWSERS_PATH is set.
  if ($PSCmdlet.ShouldProcess("playwright browsers", "install chromium firefox webkit")) {
    Write-Host "  playwright: chromium firefox webkit + deps"
    & npx --yes playwright install --with-deps chromium firefox webkit 2>&1 | Out-String | Write-Verbose
  }
}

# ── 6. Verify ─────────────────────────────────────────────────────────────────
Write-Host "`n[6/6] Verification" -ForegroundColor Cyan
$checks = [ordered]@{
  "NPM_CONFIG_PREFIX (Machine)"        = [Environment]::GetEnvironmentVariable("NPM_CONFIG_PREFIX", "Machine")
  "NPM_CONFIG_CACHE (Machine)"         = [Environment]::GetEnvironmentVariable("NPM_CONFIG_CACHE", "Machine")
  "NPM_CONFIG_GLOBALCONFIG (Machine)"  = [Environment]::GetEnvironmentVariable("NPM_CONFIG_GLOBALCONFIG", "Machine")
  "PLAYWRIGHT_BROWSERS_PATH (Machine)" = [Environment]::GetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH", "Machine")
  "user %APPDATA%\npm still present"   = (Test-Path (Join-Path $env:APPDATA "npm"))
  "user ms-playwright still present"   = (Test-Path (Join-Path $env:LOCALAPPDATA "ms-playwright"))
}
$checks.GetEnumerator() | ForEach-Object { "  {0,-38} {1}" -f $_.Key, $_.Value }

Write-Host "`nDone. Open a NEW terminal so the updated machine PATH takes effect." -ForegroundColor Green
