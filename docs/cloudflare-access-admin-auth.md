# Cloudflare Access Admin Authentication

## Why `ADMIN_TOKEN` is temporary

`ADMIN_TOKEN` is useful for early internal testing, but it is not a complete production admin authentication system. It should be treated as a temporary gate while JainWorld moves toward Cloudflare Access and stronger session-based admin controls.

## What Cloudflare Access should protect

Recommended protected URLs:

- `https://jainworld.in/admin-review.html`
- `https://jainworld.in/api/review/*`
- `https://jainworld.in/api/review-action`

## Recommended Access setup

1. Create a Cloudflare Access application for the admin page.
2. Create a second Access application for review APIs if needed.
3. Add an allow policy limited to specific admin email addresses.
4. Keep `x-admin-token` support during the transition period.

## Suggested policy direction

- Allow only named admin emails
- Deny by default
- Keep logs enabled
- Review Access policies regularly

## Header support in Phase 6

Phase 6 adds optional support for Cloudflare Access headers when:

- `ENABLE_ACCESS_AUTH=true`
- Cloudflare Access is actually enforcing those routes

This is intentionally conservative. Public traffic must not be able to spoof admin access through ordinary headers.

## Future direction

- Replace temporary token-only flows with Access + D1-backed admin users
- Add stronger session handling
- Record authenticated reviewer identity in audit logs
