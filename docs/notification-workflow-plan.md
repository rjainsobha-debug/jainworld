# Notification Workflow Plan

## Candidate notification events

- new community submission received
- correction submission received
- review approved
- review rejected
- resource flagged as stale

## Email first

Email is the safest first notification layer. Possible providers later:

- Resend
- SendGrid
- MailChannels

## WhatsApp later

WhatsApp notifications should only be considered for users who have given clear consent. They should never be used for spam or bulk unsolicited outreach.

## Security rules

- Keep provider keys out of the repo
- Store secrets only in Cloudflare environment variables
- Add audit logging when notifications become real

## Future data model

Consider a `notification_logs` table later for:

- event type
- recipient type
- delivery status
- provider response reference
- created_at
