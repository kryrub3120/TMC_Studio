/**
 * Shared Auth helper for Netlify Functions
 * TMC Studio - Supabase JWT verification for billing endpoints
 *
 * Provides a single `verifyAuth()` function that validates the
 * Authorization header against Supabase Auth and returns the
 * authenticated user's id and email.
 */

import { createClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Error thrown when authentication fails.
 * Contains an HTTP status code suitable for the API response.
 */
export class AuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

/**
 * Verify the Authorization header and return the authenticated user.
 *
 * @param authHeader - Raw Authorization header value or array
 * @returns Authenticated user with id and email
 * @throws AuthError with appropriate HTTP status code
 */
export async function verifyAuth(
  authHeader: string | string[] | undefined
): Promise<AuthUser> {
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization token', 401);
  }

  const token = headerValue.slice('Bearer '.length).trim();
  if (!token) {
    throw new AuthError('Missing authorization token', 401);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    throw new AuthError('Server configuration error', 500);
  }

  // Use anon key for token verification (getUser() verifies the JWT
  // using the Supabase Auth server, not the service role)
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthError(
      error?.message || 'Invalid or expired token',
      401
    );
  }

  return {
    id: data.user.id,
    email: data.user.email || '',
  };
}