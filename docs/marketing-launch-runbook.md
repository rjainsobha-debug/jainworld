# JainWorld Marketing and Directory Launch Runbook

## Directory Growth Workflow

1. Add or update entries in `public/data/*.json`.
2. Prefer review-first placeholders when verification is incomplete.
3. Add Hindi fields wherever possible.
4. Rebuild the search seed with `node .\tools\build-search-index-seed.js`.
5. Review search snippets and public rendering before deploy.

## How to Add a New Resource Safely

- Start with a short, cautious summary.
- Do not publish official eligibility, deadlines, trust contacts, or temple visit details without verification.
- Leave URLs blank instead of guessing.
- Use `needs_review` when the source is incomplete.

## How to Mark `needs_review`

Use `needs_review` when:

- a directory record is only structural
- a trust, institution, or event lacks verified source links
- a speaker profile is still placeholder-only
- a name meaning or glossary entry may need doctrinal nuance review

## Copyright and Verification Safety

- Do not copy competitor wording.
- Do not add copyrighted books, lyrics, PDFs, periodicals, or lecture transcripts.
- Do not scrape websites.
- Keep temple, scholarship, and government-related content explicitly verification-first.

## Suggested Launch Messaging

- “Explore JainWorld’s growing Jain directory.”
- “Search Jain learning, temples, names, and community resources in one place.”
- “Help improve the directory through review-first suggestions and corrections.”
