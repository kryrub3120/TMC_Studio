/**
 * Shared CORS helper for Netlify Functions
 * TMC Studio - Allowlist-based CORS for billing endpoints
 *
 * Security: only allows known origins and Netlify deploy previews.
 * Replaces bare Access-Control-Allow-Origin: '*' on billing functions.
 */

/**
 * Get the list of allowed origins from hardcoded values + env override.
 * Env var ALLOWED_ORIGINS is a comma-separated list of extra origins
 * (used by Netlify deploy previews).
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  const additional = envOrigins
    ? envOrigins.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  return [
    // Production
    'https://tmcstudio.app',
    'https://www.tmcstudio.app',
    // Local development
    'http://localhost:5173',
    'http://localhost:8888',
    // Extra origins from env (Netlify deploy previews, etc.)
    ...additional,
  ];
}

/**
 * Get CORS headers for the given request origin.
 *
 * Returns `{ headers }` if the origin is allowed.
 * Returns `null` if the origin is rejected.
 *
 * When origin is undefined (server-to-server calls), defaults to
 * production origin.
 */
export function getCorsHeaders(
  requestOrigin: string | undefined
): { headers: Record<string, string> } | null {
  const allowed = getAllowedOrigins();

  // No origin → server-to-server or direct curl; allow with production origin
  if (!requestOrigin) {
    return {
      headers: {
        'Access-Control-Allow-Origin': 'https://tmcstudio.app',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        Vary: 'Origin',
        'Content-Type': 'application/json',
      },
    };
  }

  // Reject disallowed origins
  if (!allowed.includes(requestOrigin)) {
    return null;
  }

  return {
    headers: {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      Vary: 'Origin',
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Handle OPTIONS preflight request.
 *
 * Returns a 204 response for allowed origins, or null if the method
 * is not OPTIONS (caller should continue processing).
 */
export function handlePreflight(event: {
  httpMethod?: string;
  headers: Record<string, string | string[] | undefined>;
}): { statusCode: number; headers: Record<string, string>; body: string } | null {
  if (event.httpMethod !== 'OPTIONS') return null;

  const origin =
    typeof event.headers.origin === 'string'
      ? event.headers.origin
      : undefined;
  const cors = getCorsHeaders(origin);

  if (!cors) {
    // Disallowed origin — return 204 without CORS headers so the
    // browser refuses to read the response
    return { statusCode: 204, headers: {}, body: '' };
  }

  return { statusCode: 204, headers: cors.headers, body: '' };
}