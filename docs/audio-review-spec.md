# JainWorld Audio Review Spec

## Purpose
Create a safe workflow for public Jain audio references without uploading copyrighted content or exposing unclear permissions.

## Audio Categories
- Bhajan
- Aarti
- Stavan
- Pravachan
- Mantra
- Kids Audio
- Meditation
- Festival Special

## Permission Status Values
- `embedded`
- `permission_received`
- `public_domain`
- `needs_review`
- `rejected_copyright`

## Required Metadata
- Title
- Category
- Source URL
- Embed URL
- Speaker
- Singer
- Tradition
- Language
- Duration
- Published date
- Permission status
- Verified status

## Review Rules
- Embedded-only references are safer than uploads when permission is unclear.
- Do not publish downloadable media files without explicit permission or a public-domain basis.
- Lyrics, translations, and transcript notes should be reviewed separately from media permissions.
- Keep source attribution visible wherever possible.

## Copyright Caution
- Do not upload copyrighted bhajans, aartis, or pravachans without permission.
- If a contributor cannot confirm rights, keep the item in `needs_review` or reject it.
- Public-domain claims should be documented in admin notes.

## Future Workflow
1. Contributor submits source link and metadata.
2. Reviewer checks permission status and speaker attribution.
3. Editorial reviewer checks category, language, and descriptive accuracy.
4. Only then should the item become broadly visible on the public site.
