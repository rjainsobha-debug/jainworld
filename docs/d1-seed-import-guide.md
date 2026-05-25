# D1 Seed Import Guide

## Purpose

The Phase 6 seed tool converts selected JSON starter data into SQL files so you can inspect them before importing into D1.

## Generate SQL files

From the project root:

```powershell
node .\tools\seed-d1-from-json.js
```

This generates:

- `db/seed-resources.sql`
- `db/seed-news.sql`
- `db/seed-audio.sql`
- `db/seed-temple-corrections-sample.sql`

## Inspect before import

Review the generated SQL carefully before running it remotely. These files are intended as seed helpers, not blind production migrations.

## Execute with Wrangler

Example:

```powershell
npx wrangler d1 execute jainworld-db --remote --file .\db\seed-resources.sql
```

Repeat for each seed file as needed.

## Avoid duplicates

The seed tool uses `INSERT OR IGNORE` with explicit IDs so reruns do not create duplicate rows when the same IDs already exist.

## Review status guidance

- Resources and news should stay review-oriented unless they have already been verified.
- Do not mass-publish data directly from seeds.

## Rollback

Rollback should be handled manually by deleting specific seeded rows by ID after verification.
