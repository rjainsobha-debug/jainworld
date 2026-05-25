# Phase 5 API Test Commands

Replace:

- `YOUR_PAGES_DOMAIN`
- `YOUR_ADMIN_TOKEN_HERE`
- `REPLACE_ME`

## 1. Check health

```powershell
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/health"
```

## 2. POST community submission

```powershell
$body = @{
  name = "Test User"
  email = "test@example.com"
  mobile = "9876543210"
  city = "Mumbai"
  country = "India"
  join_as = "General Member"
  preferred_language = "English"
  contribution_interest = "Community support"
  whatsapp_consent = $false
  privacy_consent = $true
  website = ""
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/community-submit" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 3. POST correction submission

```powershell
$body = @{
  correction_type = "Wrong phone/website"
  related_page = "/temple-detail.html?slug=sample-temple"
  related_slug = "sample-temple"
  temple_slug = "sample-temple"
  title = "Phone number update"
  description = "Please verify the current temple contact number."
  source_url = "https://example.org/temple-directory"
  submitted_by_name = "Test User"
  submitted_by_email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/correction-submit" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 4. GET review queue with x-admin-token

```powershell
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/review/community?status=pending_review&limit=20" `
  -Headers @{ "x-admin-token" = "YOUR_ADMIN_TOKEN_HERE" }
```

## 5. POST review action approve

```powershell
$body = @{
  item_type = "community"
  item_id = "REPLACE_ME"
  action = "approve"
  notes = "Approved after manual review."
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/review-action" `
  -Method Post `
  -Headers @{ "x-admin-token" = "YOUR_ADMIN_TOKEN_HERE" } `
  -ContentType "application/json" `
  -Body $body
```
