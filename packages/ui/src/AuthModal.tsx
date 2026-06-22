/**
 * AuthModal - Login/Register Modal
 * TMC Studio - Authentication UI
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from './i18n.js';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName?: string) => Promise<void>;
  onSignInWithGoogle?: () => Promise<void>;
  onSendResetLink?: (email: string) => Promise<void>;
  onResendConfirmation?: (email: string) => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
  /** DEV-ONLY: instantly sign in as a fake free/pro/team user for testing.
   *  Only pass this in when import.meta.env.DEV is true - safe to remove
   *  later along with the matching block in useAuthStore. */
  onDevLogin?: (tier: 'free' | 'pro' | 'team') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onSignUp,
  onSignInWithGoogle,
  onSendResetLink,
  onResendConfirmation,
  onDevLogin,
  error,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setLocalError(null);
    setSuccessMessage(null);
  }, []);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    // Validation — forgot mode only needs email
    if (mode === 'forgot') {
      if (!email) {
        setLocalError(t('auth.requiredFields'));
        return;
      }
    } else if (!email || !password) {
      setLocalError(t('auth.requiredFields'));
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError(t('auth.passwordsMismatch'));
        return;
      }
      if (password.length < 8) {
        setLocalError(t('auth.passwordTooShort'));
        return;
      }
    }

    try {
      if (mode === 'login') {
        await onSignIn(email, password);
        onClose();
      } else if (mode === 'register') {
        await onSignUp(email, password, fullName || undefined);
        setSuccessMessage(t('auth.verifyEmail'));
        resetForm();
        setMode('login');
      } else if (mode === 'forgot') {
        if (onSendResetLink) {
          await onSendResetLink(email);
          setSuccessMessage(t('auth.resetEmailSent'));
          resetForm();
          setMode('login');
        }
      }
    } catch (err) {
      // Error is handled by parent via error prop
    }
  };

  const handleGoogleSignIn = async () => {
    if (onSignInWithGoogle) {
      try {
        // A5: close modal immediately so user sees the board during OAuth popup
        onClose();
        await onSignInWithGoogle();
      } catch (err) {
        // Error handled by parent (toast shows failure)
      }
    }
  };

  if (!isOpen) return null;

  // Store may emit a translation key (e.g. 'auth.errorOfflineMode') for
  // fixed errors; Supabase errors come through as raw messages. Translate
  // only the known sentinel keys, pass everything else through verbatim.
  const translatedError = error && error.startsWith('auth.error') ? t(error) : error;
  const displayError = localError || translatedError;
  const isUnconfirmedError = error === 'auth.errorEmailNotConfirmed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-white/10">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              {mode === 'login' && t('auth.continueFree')}
              {mode === 'register' && t('auth.continueFree')}
              {mode === 'forgot' && t('auth.resetPassword')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'login' && t('auth.signInSubtitle')}
            {mode === 'register' && t('auth.signInSubtitle')}
            {mode === 'forgot' && t('auth.resetSubtitle')}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {displayError}
            </div>
          )}

          {/* Resend confirmation (shown when login fails with unconfirmed email) */}
          {isUnconfirmedError && onResendConfirmation && email && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm space-y-2">
              <p>{t('auth.emailNotConfirmed')}</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onResendConfirmation(email);
                    setSuccessMessage(t('auth.confirmationResent'));
                  } catch {
                    // Error shown via parent error prop
                  }
                }}
                disabled={isLoading}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
              >
                {t('auth.resendConfirmation')}
              </button>
            </div>
          )}

          {/* DEV-ONLY: Test login buttons - bypass Google/Supabase entirely.
              onDevLogin is only passed in from the app when
              import.meta.env.DEV is true. Safe to delete this block +
              onDevLogin prop + useAuthStore.devLogin once real-auth
              testing is done. */}
          {onDevLogin && mode !== 'forgot' && (
            <div className="mb-5 p-3 border border-dashed border-yellow-500/50 rounded-lg bg-yellow-500/5">
              <p className="text-[11px] uppercase tracking-wide text-yellow-400 font-semibold mb-2">
                {t('auth.devLogin')}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onDevLogin('free')}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-md transition-colors"
                >
                  {t('auth.freeTier')}
                </button>
                <button
                  type="button"
                  onClick={() => onDevLogin('pro')}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-md transition-colors"
                >
                  {t('auth.proTier')}
                </button>
                <button
                  type="button"
                  onClick={() => onDevLogin('team')}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 rounded-md transition-colors"
                >
                  {t('auth.teamTier')}
                </button>
              </div>
            </div>
          )}

          {/* Google Sign In */}
          {mode !== 'forgot' && onSignInWithGoogle && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('auth.continueGoogle')}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-sm text-gray-500">{t('auth.or')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('auth.fullName')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('auth.confirmPassword')}
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
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

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
                  {t('auth.loading')}
                </span>
              ) : (
                <>
                  {mode === 'login' && t('auth.signIn')}
                  {mode === 'register' && t('auth.createAccount')}
                  {mode === 'forgot' && t('auth.sendResetLink')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center text-sm text-gray-400 space-y-2">
          <div>
            {mode === 'login' && (
              <>
                {t('auth.noAccount')}{' '}
                <button
                  onClick={() => handleModeChange('register')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {t('auth.signUp')}
                </button>
              </>
            )}
            {mode === 'register' && (
              <>
                {t('auth.alreadyAccount')}{' '}
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {t('auth.signIn')}
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => handleModeChange('login')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                ← {t('auth.backToSignIn')}
              </button>
            )}
          </div>
          {mode !== 'forgot' && (
            <p className="text-xs text-gray-500">
              {t('auth.freeForever')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
