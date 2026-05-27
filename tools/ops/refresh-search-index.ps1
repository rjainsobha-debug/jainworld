param(
  [switch]$Remote
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

Write-Host "Rebuilding JainWorld search index seed..."
node .\tools\build-search-index-seed.js

Write-Host ""
Write-Host "Manual D1 import commands:"
Write-Host '  npx wrangler d1 execute jainworld-db --remote --command "DELETE FROM search_index;"'
Write-Host '  npx wrangler d1 execute jainworld-db --remote --file .\db\seed-search-index-d1-clean.sql'

if (-not $Remote) {
  Write-Host ""
  Write-Host "Remote import not run. Use -Remote only after checking the seed files."
  exit 0
}

$confirm = Read-Host "Type YES to import the rebuilt search index into remote D1"
if ($confirm -ne "YES") {
  Write-Host "Remote import cancelled."
  exit 0
}

Write-Host "Clearing remote search_index..."
npx wrangler d1 execute jainworld-db --remote --command "DELETE FROM search_index;"

Write-Host "Importing rebuilt remote search_index..."
npx wrangler d1 execute jainworld-db --remote --file .\db\seed-search-index-d1-clean.sql
