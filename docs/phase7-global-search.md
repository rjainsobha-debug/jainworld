# Phase 7 Global Search

## What Phase 7 added

Phase 7 introduces a public search-first foundation for JainWorld:

- `search.html`
- same-origin `GET /api/search`
- content-type filters
- local JSON fallback search
- simple ranking and snippets
- popular searches
- no-results helper
- search query logging in D1

## Public behavior

`Search JainWorld` is now a first-class entry point for finding:

- literature
- education
- temples
- food guidance
- news
- blogs
- audio
- resources
- calendar content

## API response

`/api/search?q=...&type=...&limit=...`

Returns:

- `ok`
- `query`
- `type`
- `results`
- `count`
- `logged`

## JSON fallback

If same-origin search fails or D1 cannot serve search results, the frontend still searches local sample JSON files so the search page remains useful during development or partial backend outages.

## Logging and privacy

Phase 7 logs:

- query
- type
- result_count
- source
- created_at

It does not log raw private community data. Search is public-facing and excludes private queues.

## What this is not yet

This is not full AI answering yet. Search shows source-linked results only. High-risk areas such as religion, government schemes, health, legal matters, and formal guidance still require source-based review.

## Future direction

Later phases can add:

- semantic search
- vector search
- source citation UI
- content-gap dashboards
- approved-answer generation through backend-only AI workflows
