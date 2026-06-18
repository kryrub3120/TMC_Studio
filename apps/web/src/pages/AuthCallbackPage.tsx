import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { logger } from '../lib/logger';

/**
 * Dedicated OAuth callback handler — Supabase PKCE recommended pattern.
 *
 * Google OAuth redirects here (/auth/callback?code=xxx&state=xxx).
 * supabase.auth.getSession() internally awaits the PKCE code exchange
 * (via initializePromise), so a single await is all we need — no polling,
 * no race conditions, no missed events.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      if (!supabase) {
        navigate('/app', { replace: true });
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (cancelled) return;

        if (error || !session?.user) {
          logger.error('[Auth] OAuth callback: no session after exchange', error);
          navigate('/app', { replace: true });
          return;
        }

        logger.debug('[Auth] OAuth callback: session obtained for', session.user.email);

        let user = null;
        try {
          user = await getCurrentUser(session.user);
        } catch (err) {
          logger.error('[Auth] OAuth callback: getCurrentUser failed, using session fallback', err);
          user = {
            id: session.user.id,
            email: session.user.email ?? '',
            full_name:
              session.user.user_metadata?.full_name ??
              session.user.user_metadata?.name ??
              undefined,
            avatar_url:
              session.user.user_metadata?.avatar_url ??
              session.user.user_metadata?.picture ??
              undefined,
            subscription_tier: 'free' as const,
          };
        }

        if (cancelled) return;

        if (user) {
          useAuthStore.setState({
            user,
            isAuthenticated: true,
            isPro: user.subscription_tier === 'pro' || user.subscription_tier === 'team',
            isTeam: user.subscription_tier === 'team',
            teamId: (user as any).team_id ?? null,
            isLoading: false,
          });
          logger.debug('[Auth] OAuth callback: store updated, navigating to /app');
        }
      } catch (err) {
        logger.error('[Auth] OAuth callback: unexpected error', err);
      }

      if (!cancelled) {
        navigate('/app', { replace: true });
      }
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [navigate]);

  return null;
}
