$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root
$results = @()
$mojibakeParts = @(
  [string]([char]0x00E0) + [char]0x00A4,
  [string]([char]0x00E0) + [char]0x00A5,
  [string]([char]0x00E2) + [char]0x0080 + [char]0x00A2,
  [string]([char]0x00C2) + [char]0x00A9,
  [string]([char]0x00E2) + [char]0x0080 + [char]0x0094,
  [string]([char]0x00E2) + [char]0x0080 + [char]0x0093
)
$mojibakePattern = [string]::Join("|", $mojibakeParts)
$secretKeys = @(
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
  "ADMIN_TOKEN",
  "TURNSTILE_SECRET_KEY",
  "API_KEY",
  "SECRET",
  "PASSWORD"
)
$secretPattern = [string]::Join("|", ($secretKeys | ForEach-Object { "{0}=" -f $_ }))

function Add-Result {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Details = ""
  )

  $script:results += [pscustomobject]@{
    Name = $Name
    Status = if ($Ok) { "OK" } else { "FAIL" }
    Details = $Details
  }
}

function Run-Check {
  param(
    [string]$Name,
    [scriptblock]$Script
  )

  try {
    & $Script
    Add-Result -Name $Name -Ok $true
  } catch {
    Add-Result -Name $Name -Ok $false -Details $_.Exception.Message
  }
}

Run-Check -Name "public js syntax" -Script {
  Get-ChildItem .\public\js\*.js | ForEach-Object { node --check $_.FullName | Out-Null }
}

Run-Check -Name "functions js syntax" -Script {
  Get-ChildItem .\functions -Recurse -Include *.js | ForEach-Object { node --check $_.FullName | Out-Null }
}

Run-Check -Name "tools js syntax" -Script {
  Get-ChildItem .\tools -Recurse -Include *.js | ForEach-Object { node --check $_.FullName | Out-Null }
}

Run-Check -Name "public data json parse" -Script {
  Get-ChildItem .\public\data\*.json | ForEach-Object {
    node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));" $_.FullName | Out-Null
  }
}

Run-Check -Name "mojibake scan" -Script {
  rg -n $mojibakePattern .\public .\docs .\tools | Out-Null
  if ($LASTEXITCODE -gt 1) { throw "mojibake scan command failed" }
  if ($LASTEXITCODE -eq 0) { throw "mojibake pattern found" }
}

Run-Check -Name "secret scan" -Script {
  rg -n $secretPattern . --glob '!.env.example' --glob '!docs/**' --glob '!wrangler.toml.example' | Out-Null
  if ($LASTEXITCODE -gt 1) { throw "secret scan command failed" }
  if ($LASTEXITCODE -eq 0) { throw "secret-like pattern found" }
}

Add-Result -Name "public/sitemap.xml" -Ok (Test-Path .\public\sitemap.xml)
Add-Result -Name "public/favicon.svg" -Ok (Test-Path .\public\favicon.svg)
Add-Result -Name "public/404.html" -Ok (Test-Path .\public\404.html)

$results | ForEach-Object {
  Write-Host ("[{0}] {1}" -f $_.Status, $_.Name)
  if ($_.Details) {
    Write-Host ("  {0}" -f $_.Details)
  }
}

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })
Write-Host ""
if ($failed.Count -eq 0) {
  Write-Host "Validation summary: OK"
  exit 0
}

Write-Host ("Validation summary: FAIL ({0} check(s) failed)" -f $failed.Count)
exit 1
