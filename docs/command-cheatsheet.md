# JainWorld Command Cheatsheet

```powershell
cd "C:\Users\Lenovo\Documents\jainworld-live-repo"
```

```powershell
.\tools\ops\local-health-check.ps1
```

```powershell
.\tools\ops\run-review.ps1
```

```powershell
.\tools\ops\refresh-search-index.ps1
```

```powershell
.\tools\ops\refresh-search-index.ps1 -Remote
```

```powershell
.\tools\ops\deploy-checklist.ps1
```

```powershell
.\tools\ops\clear-local-env.ps1
```

```powershell
node .\tools\run-all-review-bots.js
```

```powershell
npx wrangler d1 execute jainworld-db --remote --command "SELECT content_type, COUNT(*) AS total FROM search_index GROUP BY content_type ORDER BY content_type;"
```

```powershell
Invoke-RestMethod -Uri "https://jainworld.in/api/health"
```
