# Phase 9 Test Commands

Replace `YOUR_PAGES_DOMAIN` and `YOUR_ADMIN_TOKEN_HERE` before running these commands.

## 1. Ask Without Provider

```powershell
$body = @{
  question = "Why do Jains follow Ahimsa?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 2. Scholarship / Resource Question

```powershell
$body = @{
  question = "What documents are needed for minority scholarships?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 3. Hindi Question

```powershell
$body = @{
  question = "जैन अहिंसा क्यों मानते हैं?"
  language = "hi"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 4. Temple Question

```powershell
$body = @{
  question = "Find temples with dharamshala"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 5. Audio Question

```powershell
$body = @{
  question = "Explain Namokar Mantra"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 6. Ask Feedback

```powershell
$body = @{
  question = "Why do Jains follow Ahimsa?"
  feedback = "unsafe_or_wrong"
  answer_mode = "extractive"
  source_helpful = $false
  notes = "Example review note from QA."
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask-feedback" -Method Post -ContentType "application/json" -Body $body
```

```powershell
$body = @{
  question = "What documents are needed for minority scholarships?"
  feedback = "missing_source"
  answer_mode = "insufficient"
  source_helpful = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask-feedback" -Method Post -ContentType "application/json" -Body $body
```

## 7. Content Gaps API

```powershell
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/content-gaps?limit=20" -Headers @{ "x-admin-token" = "YOUR_ADMIN_TOKEN_HERE" }
```

## 8. D1 Checks

```powershell
npx wrangler d1 execute jainworld-db --remote --command "SELECT COUNT(*) AS total FROM ask_queries;"
```

```powershell
npx wrangler d1 execute jainworld-db --remote --command "SELECT COUNT(*) AS total FROM ask_feedback;"
```

```powershell
npx wrangler d1 execute jainworld-db --remote --command "SELECT COUNT(*) AS total FROM ask_review_queue;"
```

```powershell
npx wrangler d1 execute jainworld-db --remote --command "SELECT COUNT(*) AS total FROM content_gaps;"
```
