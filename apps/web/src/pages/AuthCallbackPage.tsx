import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { logger } from '../lib/logger';

/**
 * Full-page OAuth callback — used only by the `web-redirect` surface.
 * The popup surface uses the static /auth/popup-callback.html page and
 * exchanges the PKCE code in the main window (see useAuthStore).
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const startedAt = performance.now();

    // Warm the editor bundle while the PKCE exchange completes.
    void import('../App');

    const finish = () => {
      if (done) return;
      done = true;
      navigate('/board', { replace: true });
    };

    // Safety net: if the PKCE exchange hangs, return to the app instead of
    // trapping the user on the callback route.
    const safety = setTimeout(finish, 10000);

    async function handleCallback() {
      if (!supabase) {
        clearTimeout(safety);
        finish();
        return;
      }

      try {
        const code = new URLSearchParams(window.location.search).get('code');
        // Exchange this one-time PKCE code here, once. detectSessionInUrl is
        // disabled on the shared client so initialization cannot race us.
        const result = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.getSession();
        const { data: { session }, error } = result;
        const elapsed = Math.round(performance.now() - startedAt);

        if (done) return;

        if (error || !session?.user) {
          logger.error(`[Auth] OAuth callback failed after ${elapsed}ms`, error);
        } else {
          // Use session metadata directly — skip extra DB round-trip.
          // onAuthStateChange in useAuthStore fetches the real profile later.
          const u = session.user;
          useAuthStore.setState({
            user: {
              id: u.id,
              email: u.email ?? '',
              full_name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? undefined,
              avatar_url: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? undefined,
              subscription_tier: 'free',
            },
            isAuthenticated: true,
            isPro: false,
            isTeam: false,
            teamId: null,
            isLoading: false,
          });
          logger.debug(`[Auth] OAuth callback completed in ${elapsed}ms`);
        }
      } catch (err) {
        logger.error('[Auth] OAuth callback: unexpected error', err);
      }

      clearTimeout(safety);
      finish();
    }

    handleCallback();

    return () => {
      done = true;
      clearTimeout(safety);
    };
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f0f',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontSize: '16px',
    }}>
      Logowanie...
    </div>
  );
}
