$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

Write-Host "Running JainWorld review-first operations..."
node .\tools\run-all-review-bots.js

Write-Host ""
Write-Host "Reports created at:"
Write-Host "  tools/reports/daily-operations-summary.json"
Write-Host "  tools/reports/daily-operations-summary.txt"
