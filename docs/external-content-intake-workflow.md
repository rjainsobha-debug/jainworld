# JainWorld External Content Intake Workflow

## 1. Find Source

- Start with an official, author-linked, publisher-linked, public-domain, or clearly licensed source when possible.
- Do not scrape competitor sites or copy unattributed material.

## 2. Record Metadata

Create or update a record with:

- title
- source_name
- source_url
- source_type
- review_status

## 3. Check License

- Record `license_status`.
- If the rights are unclear, do not guess.
- Use `permission_status = needs_review`.

## 4. Decide Proposed Use

Choose the safest intended use:

- `link_only`
- `summary`
- `quote_short`
- `image_display`
- `embed`
- `host_file`
- `metadata_only`

When in doubt, use `metadata_only` or `link_only`.

## 5. Add Attribution

- Record `attribution_text`.
- Add creator and license details when relevant.
- Note `changes_made` for images or adapted media.

## 6. Mark Permission Status

- `allowed` when permission is clear for the intended use
- `needs_review` when uncertain
- `not_allowed` when the material should not be published
- `metadata_only` when the entry is only a reference record

## 7. Review

- Add the item to a review queue if needed.
- Use the source-permission review bot to catch missing fields.

## 8. Publish Link / Summary Only

- Do not host copyrighted files by default.
- Prefer summaries, metadata, and external links until rights are verified.

## 9. Refresh Search Index

If public metadata changes:

```powershell
node .\tools\build-search-index-seed.js
```

Refresh D1 only after review.

## 10. Handle Takedown / Correction

- Respond quickly to copyright or source concerns.
- Mark the record `needs_review` or `not_allowed`.
- Remove public hosting or embeds where necessary.
