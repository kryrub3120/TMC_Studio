# TMC Studio - Error Monitoring

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

## Follow-up

Source-map upload needs a Sentry auth token plus the organization and project
identifiers. Add it only after the Sentry project is selected; error collection
works without it, but production stack traces will remain minified.
