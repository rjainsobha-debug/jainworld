# JainWorld Calendar Data Policy

JainWorld calendar data must be trust-first.

## Core rules

- Do not invent dates.
- Do not present uncertain dates as final.
- Do not publish exact dates without source support.
- Do not treat one date as universal when tradition or location can change observance.

## Source requirement

Every exact date record should include:

- `source_name`
- `source_url` or `source_note`
- `tradition_scope`
- `location_scope`
- `date_confidence`

If these are missing, keep the record in `needs_review`.

## Date confidence rules

- `verified`: reviewed exact date with source and verification metadata
- `source_provided`: source-backed date that still needs local confirmation
- `needs_review`: uncertain or incomplete date record
- `educational_only`: learning record with no exact date

## Local sangh verification

Jain festival, tithi, vrat, Ayambil, Chaudas, Ekadashi, Dwadashi, and local programmes can vary by:

- panchang
- location
- tradition
- local sangh practice

For religious decisions, users should be encouraged to verify locally.

## Tradition and location scope

Use clear scope values such as:

- `general`
- `shwetambar`
- `digambar`
- `sthanakvasi`
- `terapanth`
- `local`
- `needs_review`

And location values such as:

- `India`
- `global`
- `local`
- `needs_review`

## How to add a date

1. Add or update the record in `public/data/review-calendar-events.json`.
2. Add source details in `public/data/calendar-sources.json` if needed.
3. Keep `date_confidence = needs_review` until the date is actually reviewed.
4. After review, move or mirror the safe public-facing educational record in `public/data/sample-calendar.json` only when appropriate.

## Educational-only records

Use `educational_only` when:

- the topic is useful for learning
- exact observance date is not verified
- the page should still explain the festival or practice safely

Educational-only records should keep `date_gregorian = null`.

## Local sangh events

Local sangh events should stay placeholder-only until:

- source is clear
- location is clear
- organiser context is clear
- correction path is available

## Review command

Run the calendar review bot before trusting or publishing calendar changes:

```powershell
node .\tools\bots\calendar-review-preview.js
```

## Digital Panchang archive

- Treat the 2026 digital Panchang archive as source-provided reference material.
- Do not OCR dense pages directly into public dates.
- Keep `permission_status` and `review_status` visible until documentation is complete.
- Use the digital skeleton and extraction queue to guide manual review.
- Only move records toward `verified` after a human reviewer checks the extracted dates against the source scans.

## Panchang archive rule

- Scanned Panchang pages are source references first.
- Do not OCR dense Panchang pages directly into public dates.
- Preserve visible publisher and credit information.
- Use `source_provided` until JainWorld manual extraction and review are complete.
