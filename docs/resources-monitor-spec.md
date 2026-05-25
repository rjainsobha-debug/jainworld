# JainWorld Resources Monitor Spec

## Purpose
Create a future monitoring workflow for scholarships, minority resources, official directories, and institution pages while keeping JainWorld cautious and source-based.

## Monitoring Targets
- Ministry of Minority Affairs
- National Commission for Minorities
- State minority commissions
- Scholarship portals
- Official institution websites
- Official trust and NGO pages

## Core Rules
- Only use official source URLs when presenting eligibility or deadline details.
- Store `last_verified_at` for every reviewed item.
- Mark a record `needs_update` if it becomes stale or source details change.
- Do not claim benefit eligibility without an official source reference.
- Admin review is required before anything is shown publicly as current guidance.

## Signals To Watch
- Deadline changes
- Application portal changes
- Official circulars or notices
- Contact detail changes
- Eligibility wording changes
- Institution or hostel admissions updates

## Suggested Workflow
1. Crawl approved source list.
2. Detect changes in text, date, or URL structure.
3. Create a staging record with comparison notes.
4. Mark the public record `needs_update` if the change appears important.
5. Require admin approval before updating public resource copy.

## Recommended Fields
- `id`
- `title_en`
- `category`
- `state`
- `official_url`
- `source_name`
- `last_verified_at`
- `review_status`
- `status`
- `admin_notes`

## Safety Notes
- Never imply that Jain-specific eligibility exists unless the source explicitly states it.
- Prefer general guidance wording when source certainty is limited.
- Flag missing or stale official links for review instead of keeping uncertain claims live.
