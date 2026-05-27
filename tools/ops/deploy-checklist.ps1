$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

Write-Host "JainWorld Deploy Checklist"
Write-Host ""
Write-Host "Git status:"
git status

Write-Host ""
Write-Host "Checklist reminders:"
Write-Host "- Check for secrets before committing."
Write-Host "- Run the review tools before pushing."
Write-Host "- Run search index refresh if public data changed."
Write-Host "- Keep all updates review-first. Do not auto-publish review data."

Write-Host ""
Write-Host "Suggested commands:"
Write-Host "# .\tools\ops\local-health-check.ps1"
Write-Host "# .\tools\ops\run-review.ps1"
Write-Host "# .\tools\ops\refresh-search-index.ps1"
Write-Host "# git add ."
Write-Host '# git commit -m "Describe the JainWorld update"'
Write-Host "# git push"

Write-Host ""
Write-Host "Live pages to check after deploy:"
Write-Host "- https://jainworld.in/"
Write-Host "- https://jainworld.in/search.html"
Write-Host "- https://jainworld.in/ask.html"
Write-Host "- https://jainworld.in/directory.html"
Write-Host "- https://jainworld.in/dictionary.html"
Write-Host "- https://jainworld.in/names.html"
Write-Host "- https://jainworld.in/speakers.html"
