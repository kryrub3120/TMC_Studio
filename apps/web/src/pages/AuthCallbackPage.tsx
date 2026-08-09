import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { logger } from '../lib/logger';
import { EVENTS, track } from '../lib/analytics';
import { translate, useTranslation, type Language } from '@tmc/ui';

/**
 * Full-page OAuth callback — used only by the `web-redirect` surface.
 * The popup surface uses the static /auth/popup-callback.html page and
 * exchanges the PKCE code in the main window (see useAuthStore).
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t, setLanguage } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get('lang');
    if (lang === 'en' || lang === 'pl' || lang === 'es') setLanguage(lang as Language);
  }, [setLanguage]);

  useEffect(() => {
    let done = false;
    const startedAt = performance.now();
    const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
    const callbackLanguage: Language =
      requestedLanguage === 'pl' || requestedLanguage === 'es' ? requestedLanguage : 'en';
    const callbackT = (key: string) => translate(key, undefined, callbackLanguage);

    // Warm the editor bundle while the PKCE exchange completes.
    void import('../App');

    const finish = () => {
      if (done) return;
      done = true;
      navigate('/board', { replace: true });
    };

    const fail = (message: string) => {
      if (done) return;
      done = true;
      setError(message);
    };

    const safety = setTimeout(() => {
      fail(callbackT('auth.callbackTimeout'));
    }, 10000);

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const providerError = params.get('error_description') || params.get('error');
      if (providerError) {
        clearTimeout(safety);
        fail(providerError);
        return;
      }

      if (!supabase) {
        clearTimeout(safety);
        fail(callbackT('auth.callbackUnavailable'));
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
          clearTimeout(safety);
          fail(error?.message || callbackT('auth.callbackSessionFailed'));
          return;
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
          track(EVENTS.AUTH_SUCCESS, { method: 'google' });
          logger.debug(`[Auth] OAuth callback completed in ${elapsed}ms`);
        }
      } catch (err) {
        logger.error('[Auth] OAuth callback: unexpected error', err);
        clearTimeout(safety);
        fail(err instanceof Error ? err.message : callbackT('auth.callbackFailed'));
        return;
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

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] p-4 text-white">
        <section className="w-full max-w-md rounded-lg border border-red-400/30 bg-[#1a1a2e] p-6 shadow-2xl" role="alert">
          <h1 className="text-xl font-semibold">{t('auth.callbackErrorTitle')}</h1>
          <p className="mt-2 text-sm text-gray-300">{t('auth.callbackErrorDescription')}</p>
          <p className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/board', { replace: true })}
            className="mt-5 w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium hover:bg-blue-500"
          >
            {t('auth.callbackBack')}
          </button>
        </section>
      </main>
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
      {t('auth.callbackLoading')}
    </div>
  );
}
