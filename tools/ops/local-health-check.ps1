$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$results = @()

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

function Test-File {
  param([string]$RelativePath)

  $fullPath = Join-Path $root $RelativePath
  Add-Result -Name $RelativePath -Ok (Test-Path -LiteralPath $fullPath) -Details $fullPath
}

Write-Host "JainWorld Local Health Check"

try {
  $nodeVersion = node --version
  Add-Result -Name "node --version" -Ok $true -Details $nodeVersion
} catch {
  Add-Result -Name "node --version" -Ok $false -Details $_.Exception.Message
}

try {
  $gitOutput = git -C $root status --short 2>&1
  if ($LASTEXITCODE -eq 0) {
    $details = if ($gitOutput) { ($gitOutput | Out-String).Trim() } else { "working tree clean or no changes shown" }
    Add-Result -Name "git status" -Ok $true -Details $details
  } else {
    Add-Result -Name "git status" -Ok $false -Details (($gitOutput | Out-String).Trim())
  }
} catch {
  Add-Result -Name "git status" -Ok $false -Details $_.Exception.Message
}

Test-File "public/index.html"
Test-File "public/search.html"
Test-File "public/ask.html"
Test-File "public/directory.html"
Test-File "tools/run-all-review-bots.js"
Test-File "db/seed-search-index-d1-clean.sql"

$failed = @($results | Where-Object { $_.Status -eq "FAIL" })

$results | ForEach-Object {
  Write-Host ("[{0}] {1}" -f $_.Status, $_.Name)
  if ($_.Details) {
    Write-Host ("  {0}" -f $_.Details)
  }
}

Write-Host ""
if ($failed.Count -eq 0) {
  Write-Host "Summary: OK"
  exit 0
}

Write-Host ("Summary: FAIL ({0} check(s) failed)" -f $failed.Count)
exit 1
