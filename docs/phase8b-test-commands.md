# Phase 8B Test Commands

These commands help verify Ask JainWorld in extractive fallback mode first, and then in optional grounded AI mode later if a backend provider is configured.

## 1. No-provider fallback

```powershell
$body = @{
  question = "Why do Jains follow Ahimsa?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 2. Resource or scheme high-risk question

```powershell
$body = @{
  question = "What documents are needed for minority scholarships?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 3. Temple question

```powershell
$body = @{
  question = "Find temples with dharamshala"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 4. Audio or mantra question

```powershell
$body = @{
  question = "Explain Namokar Mantra"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 5. Hindi question

```powershell
$body = @{
  question = "जैन अहिंसा क्यों मानते हैं?"
  language = "hi"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask" -Method Post -ContentType "application/json" -Body $body
```

## 6. Feedback

```powershell
$body = @{
  question = "Why do Jains follow Ahimsa?"
  feedback = "helpful"
  answer_mode = "extractive"
  source_helpful = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/ask-feedback" -Method Post -ContentType "application/json" -Body $body
```

## 7. D1 checks

```powershell
npx wrangler d1 execute jainworld-db --remote --command "SELECT COUNT(*) AS total FROM ask_queries;"
npx wrangler d1 execute jainworld-db --remote --command "SELECT COUNT(*) AS total FROM ask_feedback;"
npx wrangler d1 execute jainworld-db --remote --command "SELECT COUNT(*) AS total FROM ask_review_queue;"
```
