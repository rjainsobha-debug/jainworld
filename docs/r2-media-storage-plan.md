# R2 Media Storage Plan

## When to use R2

Use Cloudflare R2 when JainWorld needs durable storage for approved media that should not live only in code or third-party embeds.

## Suggested folder structure

- `temple-photos/`
- `article-covers/`
- `audio-thumbnails/`
- `approved-audio/`
- `resource-documents/`

## Required metadata

Each approved media item should track:

- source
- license_status
- permission_status
- alt_text
- caption
- reviewed_by
- reviewed_at

## Content rules

- Do not upload copyrighted media without permission
- Prefer real temple photos over generated visuals for temple records
- Prefer embeds for audio until permissions are clearly documented
- Keep generated images in a separate approval path
