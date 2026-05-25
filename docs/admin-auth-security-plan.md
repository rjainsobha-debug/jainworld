# Admin Auth Security Plan

## Why `admin-review.html` is only a prototype

The current admin review page is a static internal prototype designed to help shape workflows. It is not a secure admin interface. Until backend authentication is in place, it should never display raw private user data or real production queues.

## Initial protection approach

For the first backend-enabled version:

- Keep `admin-review.html` marked `noindex, nofollow`
- Use Cloudflare Access or a server-side `ADMIN_TOKEN` check for review APIs
- Return masked community contact details by default
- Keep write actions behind authenticated POST endpoints only

## Why secrets must never live in the frontend

Secrets in JavaScript or HTML are visible to every visitor. `ADMIN_TOKEN`, database credentials, and any future service credentials must be stored only in Cloudflare environment variables or Access configuration.

## Recommended security layers

1. Cloudflare Access in front of review/admin paths
2. D1-backed admin user table for auditability
3. Review action logging in `review_logs`
4. Rate limiting on submission endpoints
5. Future Turnstile on public forms
6. Masked mobile and email in all admin preview UIs unless a secure authenticated workflow specifically requires raw values

## Audit logging

Every review action should capture:

- item type
- item id
- previous status
- new status
- admin identity
- notes
- timestamp

This is why `review_logs` is part of the Phase 4 schema.

## Production checklist

- Configure D1 binding
- Set `ADMIN_TOKEN` securely
- Protect review endpoints with Cloudflare Access
- Enable Turnstile on public forms
- Add rate limiting and abuse monitoring
- Restrict production admin pages from search indexing
- Review privacy notices for community/correction submissions
