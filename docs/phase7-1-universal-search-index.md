# Phase 7.1 Universal Search Index

## Why `search_index` exists

Phase 7 introduced a useful search page and API, but `type=all` was limited because only a few public content tables were searchable in D1. The universal `search_index` table gives JainWorld one public-safe search surface across multiple content types.

## What it indexes

The seed builder reads safe public JSON sources for:

- literature
- blogs
- food
- education
- temples
- audio
- news
- resources
- calendar

It does not include:

- community submissions
- correction submissions
- internal review queues
- pending or private content

## How to generate the seed SQL

From the project root:

```powershell
node .\tools\build-search-index-seed.js
```

This creates:

- `db/seed-search-index.sql`

## How to apply the schema

Apply the incremental schema first:

```powershell
npx wrangler d1 execute jainworld-db --remote --file .\db\search-index-phase7-1.sql
```

## How to import the seed

After reviewing the generated SQL:

```powershell
npx wrangler d1 execute jainworld-db --remote --file .\db\seed-search-index.sql
```

## How `/api/search` behaves

1. Search `search_index` first
2. If the table is missing or query fails, fall back to the older table-specific D1 search
3. If D1 still returns nothing, the frontend JSON fallback remains available

This keeps JainWorld Search resilient during rollout.

## Natural-language hotfix

Phase 8A added a focused hotfix so `search_index` queries work better for natural-language questions and multi-word searches.

Examples:

- `documents minority scholarships`
- `namokar mantra`
- `why do jains follow ahimsa`

The search layer now:

- removes common stop words
- applies light singular or plural normalization
- expands a small JainWorld-safe synonym set
- scores token matches across title, summary, body, category, tags, and source name
- returns results when any useful token matches instead of requiring a full phrase match

Recommended manual tests:

```powershell
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/search?q=documents%20minority%20scholarships&type=all&limit=10"
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/search?q=scholarship&type=resources&limit=10"
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/search?q=namokar%20mantra&type=all&limit=10"
Invoke-RestMethod -Uri "https://YOUR_PAGES_DOMAIN/api/search?q=ahimsa&type=all&limit=10"
```

## Refreshing the index later

Whenever public content changes materially:

1. regenerate `seed-search-index.sql`
2. review the generated content
3. re-import it to D1

Later phases can replace this with scheduled index refresh jobs.

## Future direction

Later search improvements can include:

- semantic search
- vector search
- better ranking quality tuning
- content gap analysis from search logs
