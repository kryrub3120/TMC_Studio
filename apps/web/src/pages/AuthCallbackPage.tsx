import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { logger } from '../lib/logger';

export function AuthCallbackPage() {
  useEffect(() => {
    let done = false;
    void import('../App');

    const redirect = () => {
      if (!done) {
        done = true;
        window.location.replace('/app');
      }
    };

    // Safety net: if PKCE exchange hangs, redirect after 10s
    const safety = setTimeout(redirect, 10000);

    async function handleCallback() {
      if (!supabase) {
        clearTimeout(safety);
        redirect();
        return;
      }

      try {
        // Awaits initializePromise which includes the PKCE code exchange
        const { data: { session }, error } = await supabase.auth.getSession();

        if (done) return;

        if (error || !session?.user) {
          logger.error('[Auth] OAuth callback: no session', error);
          clearTimeout(safety);
          redirect();
          return;
        }

        // Use session metadata directly — skip extra DB round-trip.
        // onAuthStateChange in useAuthStore will fetch the real profile in background.
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
      } catch (err) {
        logger.error('[Auth] OAuth callback: unexpected error', err);
      }

      clearTimeout(safety);
      redirect();
    }

    handleCallback();

    return () => {
      done = true;
      clearTimeout(safety);
    };
  }, []);

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
