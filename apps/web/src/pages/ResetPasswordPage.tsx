/**
 * ResetPasswordPage - Set new password after clicking recovery link
 *
 * PKCE exchange happens on this page via Supabase SDK detectSessionInUrl.
 * User lands here after clicking the reset link in the email.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@tmc/ui';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setError(t('auth.authNotConfigured'));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsReady(true);
      } else {
        // Retry a few times to allow PKCE exchange to complete
        const retries = [500, 1500, 3000];
        let done = false;
        retries.forEach((delay) => {
          setTimeout(async () => {
            if (done) return;
            const { data: { session: retrySession } } = await supabase!.auth.getSession();
            if (retrySession?.user) {
              done = true;
              setIsReady(true);
            }
          }, delay);
        });
        setTimeout(() => {
          if (!done) {
            done = true;
            setError(t('auth.resetPasswordInvalid'));
          }
        }, 4000);
      }
    });
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError(t('auth.resetPasswordEnterNew'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) throw new Error(t('auth.authNotConfigured'));
      
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      logger.debug('[Auth] Password reset successful');

      setTimeout(() => {
        navigate('/app', { replace: true });
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.resetFailed');
      logger.error('[Auth] Password reset error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a2e] rounded-xl shadow-2xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">
              {t('auth.resetPasswordTitle')}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {t('auth.resetPasswordSubtitle')}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success */}
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                {t('auth.resetPasswordSuccess')}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {!isReady && !error && (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                <p className="text-gray-400 text-sm">{t('auth.resetPasswordVerifying')}</p>
              </div>
            )}

            {isReady && !success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {t('auth.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    {t('auth.confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('auth.resettingPassword')}
                    </span>
                  ) : (
                    t('auth.resetPasswordButton')
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer with back link (only if not success) */}
          {!success && (
            <div className="px-6 pb-6 text-center">
              <button
                onClick={() => navigate('/', { replace: true })}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {t('auth.resetPasswordBackHome')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}