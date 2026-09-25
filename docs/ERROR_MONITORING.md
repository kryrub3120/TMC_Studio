# TMC Studio - Error Monitoring

**Status:** ACTIVE in production (2026-08-09)
**Environment:** `production`
**Release:** `9f136c4`

## Scope

The web application supports optional Sentry error monitoring. The integration
captures uncaught browser errors, unhandled promise rejections, React rendering
failures, and errors sent through the application logger.

The launch configuration intentionally disables performance tracing and session
replay. `sendDefaultPii` is disabled. Without `VITE_SENTRY_DSN`, monitoring is a
no-op and the Sentry browser SDK is not loaded.

## Production Variables

Set these values in Netlify for the production deploy context:

- `VITE_SENTRY_DSN` - public browser DSN from the Sentry project (required).
- `VITE_SENTRY_ENVIRONMENT=production` - environment label (recommended).
- `VITE_APP_RELEASE` - deploy/release identifier (optional).

After changing a `VITE_*` variable, rebuild and redeploy the site because Vite
embeds these values into the browser bundle at build time.

## Verification

1. Deploy with `VITE_SENTRY_DSN` configured.
2. Confirm the application loads without new console errors.
3. Trigger a controlled test exception in a deploy preview or local production
   build, never in the live editor flow.
4. Confirm the event appears in Sentry with the correct environment and URL.
5. Remove the controlled exception and deploy again.

Production verification completed on 2026-08-09 without adding a persistent
test exception to the application. The SDK loaded once, CSP reported no
violations, and the Sentry envelope endpoint returned HTTP 200. The production
CSP permits only the exact ingest host assigned to the TMC Studio project.

## Save Monitoring

Cloud saves report to Sentry through `apps/web/src/lib/saveMonitoring.ts`.
Every event carries the tag `module=save`. No document content, project names
or user data are sent.

| Event | When | Grouping (fingerprint) | Level |
|---|---|---|---|
| Failed cloud save | `saveToCloud` throws (create or update) | `save`, `create`/`update`, error code | error |
| `save.stuck_unsaved` | save badge not "saved" for 60 s while online | `save`, `stuck_unsaved` | warning |
| `save.invalid_document` | document fails `validateBoardDocument` (`@tmc/core`); the cloud save is blocked, the local copy is kept | `save`, `invalid_document` | error |
| `save.document_warnings` | document is loadable but suspicious (duplicated ids, unknown element type, step index out of range); saved anyway | `save`, `document_warnings` | warning |

Tags: `save.trigger` (`autosave`, `manual`, `other`), `save.op`, `save.code`
(PostgREST code such as `42501`, `http_<status>`, `network` or the error name)
and `online`. Extras: consecutive failures, project id, step and element count.
A save skipped while offline is not reported.

Rate limits: one event per fingerprint per 5 minutes, at most 20 save events
per browser session. Successful saves add a `save` breadcrumb.

The application logger also keeps `code`, `details` and `hint` of Supabase
error objects, which are plain objects rather than `Error` instances.

Recommended Sentry alerts (configured in Sentry, not in code):

| Alert | Condition | Action |
|---|---|---|
| New save error | new issue with tag `module:save` | e-mail + push |
| Save error spike | more than 10 events with `module:save` in 1 hour | e-mail + push |
| Stuck save | any `save.stuck_unsaved` event | e-mail |
| Invalid document | any `save.invalid_document` event | e-mail + push |

## Follow-up

Source-map upload needs a Sentry auth token plus the organization and project
identifiers. Add it only after the Sentry project is selected; error collection
works without it, but production stack traces will remain minified.
