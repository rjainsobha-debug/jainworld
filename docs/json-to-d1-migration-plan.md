# JSON to D1 Migration Plan

## Goal

Move the current static JSON review prototypes into Cloudflare D1 without breaking the public static site or the existing JSON fallback behavior.

## Source data to migrate

- `public/data/sample-resources.json`
- `public/data/review-news.json`
- `public/data/review-resources.json`
- `public/data/review-audio.json`
- `public/data/review-temple-corrections.json`
- `public/data/review-community.json`
- `public/data/review-images.json`
- Future stored community and correction submissions

## Recommended import order

1. `admin_users`
2. `resources`
3. `news_items`
4. `audio_items`
5. `image_assets`
6. `community_submissions`
7. `correction_submissions`
8. `temple_corrections`
9. `review_logs`

## Table mapping

| JSON source | D1 table |
| --- | --- |
| `sample-resources.json` | `resources` |
| `review-news.json` | `news_items` |
| `review-resources.json` | `resources` or a staging import flow |
| `review-audio.json` | `audio_items` |
| `review-temple-corrections.json` | `temple_corrections` |
| `review-community.json` | `community_submissions` |
| `review-images.json` | `image_assets` |

## Safety checks before import

- Validate JSON structure
- Normalize slugs and review statuses
- Strip or mask any accidental private data in seed files
- Confirm all timestamps are ISO strings
- Confirm no draft sample text is being promoted to public status automatically

## Rollback plan

1. Keep the current JSON files in git as the fallback baseline
2. Import into a staging D1 database first
3. Validate query outputs through `/api/review/*`
4. Only then bind the production Pages project to the production D1 database
5. If anything fails, remove the D1 binding and the frontend will continue using static JSON fallback where applicable

## Migration principle

The public site should keep working even if D1 is empty, partially configured, or temporarily unavailable.
