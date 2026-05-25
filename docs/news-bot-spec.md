# JainWorld News Bot Spec

## Purpose
Create a future review-first news discovery workflow for JainWorld that finds Jain-related updates, stages them for review, and never auto-publishes them.

## Source Types
- Google News RSS
- Bing News RSS
- Trusted Jain organization websites
- Temple and trust websites
- Official event pages
- Verified sangh or institution announcements

## Keywords
- Jain
- Jainism
- Jain temple
- Jain muni
- Jain sadhu
- Jain sadhvi
- Mahavir Jayanti
- Paryushan
- Samvatsari
- Das Lakshan
- Shikharji
- Palitana
- Digambar
- Shwetambar
- Jain minority
- Jain scholarship

## Discovery Rules
- Prefer source URLs that clearly reference Jain institutions, events, or topics.
- Store raw discovery records in a staging queue before any editorial summary is created.
- Keep region, language, and source metadata even when public display is deferred.

## Dedupe Logic
- Compare canonical URL first.
- Compare content hash next.
- Compare duplicate group id if already assigned.
- Compare normalized titles after lowercasing, punctuation cleanup, and whitespace normalization.
- Flag possible duplicates for admin review instead of deleting automatically.

## Relevance Scoring
- Score higher when Jain-specific keywords appear in the title.
- Score higher when the source is a known Jain organization or temple.
- Score lower when the article is generic and mentions Jain only once.
- Score lower when no date, organizer, or direct event context is available.

## Review Queue Rules
- All imported items go to `pending_review` first.
- Admin can mark items as `approved`, `rejected`, or `needs_update`.
- Keep admin notes explaining why an item is delayed, merged, or rejected.

## Sensitive Content Rules
- Do not auto-publish obituaries, allegations, legal disputes, or politically sensitive items.
- Do not publish event logistics without checking the original source or organizer notice.
- Do not summarize a sensitive religious disagreement without careful editorial handling.

## No Auto-Publish Rule
- Discovery is allowed.
- Queue creation is allowed.
- Public publishing must always require explicit review or approval.

## Suggested Data Model
- `id`
- `title_en`
- `title_hi`
- `slug`
- `summary_en`
- `summary_hi`
- `source_name`
- `source_url`
- `published_at`
- `category`
- `region`
- `language`
- `canonical_url`
- `content_hash`
- `duplicate_group_id`
- `relevance_score`
- `review_status`
- `status`

## Future API Plan
- `GET /api/news-review`
- `POST /api/news-review`
- `POST /api/news-approve`
- `POST /api/news-reject`
- `POST /api/news-merge-duplicate`

## Operational Note
This bot should support editorial review, not replace it.
