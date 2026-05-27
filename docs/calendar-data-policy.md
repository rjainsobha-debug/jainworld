# JainWorld Calendar Data Policy

JainWorld calendar data must stay trust-first.

## Why calendar dates need verification

- Jain observance dates can vary by panchang.
- Dates can also vary by location, sangh, and tradition.
- A general festival explanation is safer than publishing an uncertain exact date.

## No invented dates

- Never guess a Gregorian date.
- Never present a sample date as a final religious date.
- If a date is uncertain, keep it `needs_review`.

## Source requirements

Every calendar date record should include at least one of:

- `source_name`
- `source_url`
- `source_note`

If exact date details are added, they must be backed by a reviewed source.

## Tradition and location scope

Calendar records should also state:

- `tradition_scope`
- `location_scope`

If those are unknown, use `needs_review` and tell users to verify locally.

## review_status and date_confidence

Use these carefully:

- `educational_only`
  - for safe learning records with no exact date
- `needs_review`
  - for placeholder or unverified date records
- `source_provided`
  - for date records with a source attached but still needing stronger verification
- `verified`
  - only when source, scope, and review are complete

## How to add a date

1. Add or update the record in `public/data/sample-calendar.json` only if the date is genuinely reviewed.
2. Add the supporting source in `public/data/calendar-sources.json`.
3. If the record is not fully ready, place it in `public/data/review-calendar-events.json` instead.
4. Run:

```powershell
node .\tools\bots\calendar-review-preview.js
node .\tools\build-search-index-seed.js
```

## Educational-only records

Use educational-only records when:

- the festival explanation is safe
- exact date varies
- local observance differs
- a user still benefits from respectful background information

Educational-only records should not contain a fake Gregorian date.

## Local sangh events

- Local sangh events should stay review-first until manually checked.
- Do not publish local event dates without source and location verification.
- If in doubt, use a placeholder and ask users to verify locally.

## Review bot

Run the calendar review bot with:

```powershell
node .\tools\bots\calendar-review-preview.js
```

It checks:

- missing titles
- missing Hindi titles
- exact date without source
- source without URL or note
- missing `date_confidence`
- verified date without `last_verified_at`
- duplicate slugs
- weak null-date handling
