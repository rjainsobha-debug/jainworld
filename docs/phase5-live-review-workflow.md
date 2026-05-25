# Phase 5 Live Review Workflow

## What Phase 5 adds

Phase 5 turns the Phase 4 backend starter into a working review-oriented submission flow:

- D1-backed community submission endpoint
- D1-backed correction submission endpoint
- Authenticated review queue API
- Review action API that updates statuses and writes audit logs
- Admin review dashboard support for live D1 loading with JSON fallback
- Masked contact fields in admin responses

## Health check

```powershell
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/health"
```

Expected result:

- `ok: true`
- `service: jainworld-api`
- `d1_bound: true`

## Community submission test

```powershell
$body = @{
  name = "Test User"
  email = "test@example.com"
  mobile = ""
  city = "Ahmedabad"
  country = "India"
  join_as = "Volunteer"
  preferred_language = "English"
  contribution_interest = "Temple updates"
  whatsapp_consent = $true
  privacy_consent = $true
  website = ""
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/community-submit" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Correction submission test

```powershell
$body = @{
  correction_type = "Wrong timing"
  related_page = "/temple-detail.html?slug=palitana-main-temple"
  related_slug = "palitana-main-temple"
  title = "Timing update"
  description = "Please verify current morning darshan hours."
  source_url = "https://example.org/temple-notice"
  submitted_by_name = "Test User"
  submitted_by_email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/correction-submit" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Review queue test

```powershell
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/review/community?limit=20" `
  -Headers @{ "x-admin-token" = "TOKEN_PLACEHOLDER" }
```

## Review action test

```powershell
$body = @{
  item_type = "community"
  item_id = "community-REPLACE_ME"
  action = "approve"
  notes = "Reviewed manually."
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/review-action" `
  -Method Post `
  -Headers @{ "x-admin-token" = "TOKEN_PLACEHOLDER" } `
  -ContentType "application/json" `
  -Body $body
```

## Inspecting D1 data

Use the Cloudflare dashboard or Wrangler D1 commands to inspect:

- `community_submissions`
- `correction_submissions`
- `temple_corrections`
- `review_logs`

## Security note

`ADMIN_TOKEN` is only a temporary admin gate. The long-term production plan should use Cloudflare Access or a stronger authenticated admin workflow. `admin-review.html` remains `noindex` because it is an internal tool and should not be indexed by search engines.
