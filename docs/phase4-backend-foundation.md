# Phase 4 Backend Foundation

## What was added

Phase 4 adds a safe backend starter for JainWorld without replacing the current static site:

- Cloudflare Pages Functions starter endpoints under `functions/api`
- Shared function helpers under `functions/_lib`
- D1 schema in `db/schema.sql`
- `wrangler.toml.example` for local and Cloudflare configuration reference
- Admin auth and migration planning docs
- Safe frontend submit support for future community and correction endpoints

## Current API starter routes

- `GET /api/health`
- `POST /api/community-submit`
- `POST /api/correction-submit`
- `GET /api/review/:type`
- `POST /api/review-action`

## D1 configuration

1. Create a D1 database in Cloudflare
2. Apply `db/schema.sql`
3. Bind the database to the Pages project as `DB`
4. Add `ADMIN_TOKEN` as an encrypted environment variable

## How to test the API

### Health check

```bash
curl https://your-pages-domain/api/health
```

### Community submit

```bash
curl -X POST https://your-pages-domain/api/community-submit \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"privacy_consent\":true}"
```

### Correction submit

```bash
curl -X POST https://your-pages-domain/api/correction-submit \
  -H "Content-Type: application/json" \
  -d "{\"correction_type\":\"Wrong timing\",\"description\":\"Morning hours changed.\",\"related_slug\":\"sample-temple\"}"
```

### Review endpoint

```bash
curl https://your-pages-domain/api/review/news \
  -H "x-admin-token: YOUR_TOKEN"
```

## Frontend behavior today

- Public pages remain static and Cloudflare Pages friendly
- Existing live Worker API integration is preserved
- JSON fallback remains in place
- Community form now attempts `/api/community-submit` first, then falls back safely
- Correction submit helper exists for future UI wiring

## What remains for Phase 5

- Real auth and Access protection
- D1-backed live review queues
- Review actions from the admin dashboard
- Background ingestion and monitoring workflows
