import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { logger } from '../lib/logger';
import { translate } from '@tmc/ui';
import { AUTH_POPUP_MESSAGE, AUTH_POPUP_NAME } from '../auth/oauthWebPopup';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [popupRecovery, setPopupRecovery] = useState<{ status: 'success' | 'error'; error?: string } | null>(null);

  useEffect(() => {
    let done = false;
    const startedAt = performance.now();
    const isPopup =
      window.name === AUTH_POPUP_NAME ||
      window.sessionStorage.getItem('tmc-oauth-popup') === '1';

    if (!isPopup) {
      void import('../App');
    }

    const finish = (status: 'success' | 'error', error?: string) => {
      if (done) return;
      done = true;

      if (isPopup) {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: AUTH_POPUP_MESSAGE,
              status,
              error,
              elapsed: Math.round(performance.now() - startedAt),
            }, window.location.origin);
            window.setTimeout(() => window.close(), 150);
            return;
          }
        } catch (err) {
          logger.error('[Auth] OAuth callback could not notify opener', err);
        }

        setPopupRecovery({ status, error });
        window.setTimeout(() => {
          try {
            window.close();
          } catch {
            // Some browsers only allow script-opened windows to close themselves.
          }
        }, 500);
        return;
      }

      navigate('/board', { replace: true });
    };

    // Safety net: if PKCE exchange hangs, redirect after 10s
    const safety = setTimeout(() => finish('error', 'OAuth callback timed out'), 10000);

    async function handleCallback() {
      if (!supabase) {
        clearTimeout(safety);
        finish('error', 'Supabase is not configured');
        return;
      }

      try {
        // Awaits initializePromise which includes the PKCE code exchange
        const { data: { session }, error } = await supabase.auth.getSession();
        const elapsed = Math.round(performance.now() - startedAt);

        if (done) return;

        if (error || !session?.user) {
          logger.error(`[Auth] OAuth callback failed after ${elapsed}ms`, error);
          clearTimeout(safety);
          finish('error', error?.message ?? 'No Supabase session after Google login');
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
        logger.debug(`[Auth] OAuth callback completed in ${elapsed}ms`);
      } catch (err) {
        logger.error('[Auth] OAuth callback: unexpected error', err);
        const message = err instanceof Error ? err.message : 'Unexpected Google login error';
        clearTimeout(safety);
        finish('error', message);
        return;
      }

      clearTimeout(safety);
      finish('success');
    }

    handleCallback();

    return () => {
      done = true;
      clearTimeout(safety);
    };
  }, [navigate]);

  if (popupRecovery) {
    const isSuccess = popupRecovery.status === 'success';
    return (
      <div style={{
        minHeight: '100vh',
        margin: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 24,
      }}>
        <main style={{
          width: 'min(380px, calc(100vw - 32px))',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48,
            height: 48,
            margin: '0 auto 18px',
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            background: isSuccess ? '#16a34a' : '#dc2626',
            color: '#fff',
            fontSize: 26,
            fontWeight: 700,
          }}>
            {isSuccess ? 'OK' : '!'}
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>
            {translate(isSuccess ? 'auth.popupRecoverySuccessTitle' : 'auth.popupRecoveryErrorTitle')}
          </h1>
          <p style={{ margin: '0 0 18px', color: '#cbd5e1', lineHeight: 1.5 }}>
            {popupRecovery.error || translate('auth.popupRecoveryDescription')}
          </p>
          <button
            type="button"
            onClick={() => window.close()}
            style={{
              border: 0,
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '10px 16px',
            }}
          >
            {translate('auth.popupRecoveryClose')}
          </button>
        </main>
      </div>
    );
  }

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
