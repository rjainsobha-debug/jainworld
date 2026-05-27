# JainWorld Local Operations Guide

This guide is for simple manual maintenance from Windows PowerShell.
Everything here is review-first.
Nothing in this workflow auto-publishes content.

## Daily manual routine

1. Open Windows PowerShell.
2. Go to the JainWorld folder.
3. Run the review command.
4. Read the reports before making any content or data updates.

Example:

```powershell
cd "C:\Users\Lenovo\Documents\jainworld-live-repo"
.\tools\ops\run-review.ps1
```

Main reports:

- `tools/reports/daily-operations-summary.json`
- `tools/reports/daily-operations-summary.txt`

## When content or data changes

If you change files in `public/data`, rebuild the search seed:

```powershell
.\tools\ops\refresh-search-index.ps1
```

If the rebuilt seed looks correct, you can import it to remote D1:

```powershell
.\tools\ops\refresh-search-index.ps1 -Remote
```

Only do the remote import after checking the generated files.

For calendar-specific review:

```powershell
node .\tools\bots\calendar-review-preview.js
```

Use this before publishing or trusting any exact Jain festival or vrat date.

## Before pushing to GitHub

1. Run `git status`
2. Run the local health check
3. Run the review command
4. If needed, refresh the search index
5. Commit and push only after checking the reports

Recommended commands:

```powershell
git status
.\tools\ops\local-health-check.ps1
.\tools\ops\run-review.ps1
```

## After pushing

Check the live site:

- Home page
- Search page
- Ask JainWorld page
- Directory page
- Hindi mode on key pages

Also test:

- search results
- Ask JainWorld safe answers
- dictionary and directory pages

## What not to do

- Do not paste secrets into repo files.
- Do not auto-publish review JSON files.
- Do not copy copyrighted books, audio, or images.
- Do not trust unverified temple, trust, scholarship, or scheme data.
- Do not enable AI provider settings unless you are ready and have reviewed them separately.

## Important commands

```powershell
.\tools\ops\local-health-check.ps1
.\tools\ops\run-review.ps1
.\tools\ops\refresh-search-index.ps1
.\tools\ops\refresh-search-index.ps1 -Remote
.\tools\ops\deploy-checklist.ps1
.\tools\ops\clear-local-env.ps1
.\tools\ops\validate-local.ps1
```
