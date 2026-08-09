# TMC Studio - email delivery and templates

> Status: configured in production and represented in the repository.
> Last updated: 2026-08-09

## Architecture

- Supabase Auth creates confirmation, recovery, invite, magic-link, email-change
  and reauthentication messages.
- Postmark is the custom SMTP transport for Supabase Auth.
- TMC Studio passes `user_metadata.locale` during sign-up. Templates select PL,
  EN or ES from that field and fall back to English.
- Product and team messages sent outside Supabase Auth should use the Postmark
  API from a server-side Netlify Function. Never expose a Postmark server token
  in Vite or browser code.
- Organization invitations use the authenticated
  `send-organization-invite` Netlify Function and the Postmark API. The function
  verifies the owner role, active Team plan, five-seat limit and duplicate
  invitations before creating and sending a single-use token.

## Templates in the repository

| Event                  | File                                        |
| ---------------------- | ------------------------------------------- |
| Account confirmation   | `supabase/templates/confirmation.html`      |
| Password recovery      | `supabase/templates/recovery.html`          |
| Supabase user invite   | `supabase/templates/invite.html`            |
| Magic link             | `supabase/templates/magic-link.html`        |
| Email change           | `supabase/templates/email-change.html`      |
| Reauthentication       | `supabase/templates/reauthentication.html`  |
| Password changed alert | `supabase/templates/password-changed.html`  |
| Email changed alert    | `supabase/templates/email-changed.html`     |
| Sign-in method linked  | `supabase/templates/identity-linked.html`   |
| Sign-in method removed | `supabase/templates/identity-unlinked.html` |

Local Supabase uses these files through `supabase/config.toml`. Local email
confirmation is enabled to match production; Inbucket captures messages at
`http://127.0.0.1:54324`.

## Required production settings

### Postmark

Production uses the `TMC Studio Transactional` server and `TMC Studio Auth`
transactional stream. The `tacticsmadeclear.store` sending domain has verified
DKIM and custom Return-Path records. DMARC starts in monitoring mode (`p=none`).

Open and link tracking are disabled for this server. Rewritten confirmation URLs
can invalidate Supabase links.

A dedicated SMTP token is used instead of the broader Server API token. It is
stored only in Supabase's encrypted SMTP configuration and never in the repo.

The Postmark Server API token for organization invitations is stored as the
Netlify production secret `POSTMARK_SERVER_TOKEN`. It must never use a
`VITE_` prefix. Delivery failures remove the newly created pending invitation;
logs contain the invitation and Postmark message IDs, never message bodies.

### Supabase Auth

Custom SMTP points to Postmark (`smtp.postmarkapp.com`, TLS, port 587) with the
dedicated SMTP credentials. The From address is
`support@tacticsmadeclear.store` and the sender name is `TMC Studio`.

Paste the repository templates into Authentication -> Email Templates. Confirm
that Site URL is `https://tmcstudio.app` and that these redirects are allowed:

- `https://tmcstudio.app/auth/callback`
- `https://tmcstudio.app/auth/reset-password`
- local equivalents used for development

Enable security notifications for password changes, email changes and linked or
removed sign-in methods. Phone and MFA notifications stay disabled until those
features are exposed by the product.

Do not run `supabase config push` against production from the current local
config: it intentionally contains localhost URLs.

## Registration and recovery test matrix

Run each case in PL, EN and ES using inboxes that are not existing users:

1. Register with email and password.
2. Confirm that the modal preserves the success message after changing back to
   login mode.
3. Receive a branded message in the selected language and inspect From,
   Return-Path, SPF, DKIM and DMARC results.
4. Open the confirmation link; verify `/auth/callback?lang=...` and a persisted
   session on `/board`.
5. Try signing in before confirmation and resend the confirmation message.
6. Request password recovery, open the link and set a new password.
7. Confirm that an expired or reused link shows a localized error.
8. Check mobile Gmail, desktop Gmail and Outlook rendering.

## Organization invitation test matrix

1. As a Team owner with a free seat, invite a new PL, EN and ES address.
2. Confirm the localized email arrives and opens `/invite?token=...&lang=...`.
3. Sign in with the invited address, accept once and confirm club membership.
4. Confirm a second acceptance fails and the invitation is marked accepted.
5. Confirm members, Free/Pro users, duplicate addresses and a full five-seat
   club cannot create invitations.
6. Revoke a pending invitation and confirm its link can no longer be accepted.
7. Simulate a Postmark failure and confirm no pending invitation remains.

The current IP limiter is per Netlify function instance. This is sufficient for
the launch volume; replace it with a distributed limiter if invitation abuse or
horizontal scale makes instance-local counters inadequate.
