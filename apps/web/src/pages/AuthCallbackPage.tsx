import { useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { logger } from '../lib/logger';

export function AuthCallbackPage() {
  useEffect(() => {
    let done = false;

    const redirect = () => {
      if (!done) {
        done = true;
        window.location.replace('/app');
      }
    };

    // Safety net: if getSession hangs or anything goes wrong, redirect after 8s
    const safety = setTimeout(redirect, 8000);

    async function handleCallback() {
      if (!supabase) {
        clearTimeout(safety);
        redirect();
        return;
      }

      try {
        // getSession() awaits initializePromise which includes PKCE code exchange
        const { data: { session }, error } = await supabase.auth.getSession();

        if (done) return;

        if (error || !session?.user) {
          logger.error('[Auth] OAuth callback: no session', error);
          clearTimeout(safety);
          redirect();
          return;
        }

        let user = null;
        try {
          user = await getCurrentUser(session.user);
        } catch (err) {
          logger.error('[Auth] OAuth callback: getCurrentUser failed, using fallback', err);
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

        if (done) return;

        if (user) {
          useAuthStore.setState({
            user,
            isAuthenticated: true,
            isPro: user.subscription_tier === 'pro' || user.subscription_tier === 'team',
            isTeam: user.subscription_tier === 'team',
            teamId: (user as any).team_id ?? null,
            isLoading: false,
          });
        }
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
