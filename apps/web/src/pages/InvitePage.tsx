/**
 * Invite acceptance page - /invite?token=...
 * TMC Studio - Club (organization) invitations
 *
 * Looks up the invitation by token and, if the visitor is signed in with
 * the matching email, lets them accept it (adds them to
 * organization_members via the accept_invitation RPC).
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from '@tmc/ui';
import { useAuthStore } from '../store/useAuthStore';
import { getInvitationByToken, acceptInvitation, type InvitationPreview } from '../lib/organizations';

type ViewState = 'loading' | 'not-found' | 'expired' | 'ready' | 'wrong-account' | 'accepted' | 'error';

export function InvitePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authIsLoading = useAuthStore((s) => s.isLoading);

  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [state, setState] = useState<ViewState>('loading');
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setState('not-found');
        return;
      }

      const inv = await getInvitationByToken(token);
      if (cancelled) return;

      if (!inv) {
        setState('not-found');
        return;
      }

      if (inv.status === 'accepted') {
        setInvitation(inv);
        setState('accepted');
        return;
      }

      if (inv.status === 'revoked' || inv.status === 'expired' || new Date(inv.expires_at) < new Date()) {
        setInvitation(inv);
        setState('expired');
        return;
      }

      setInvitation(inv);
      setState('ready');
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setErrorMessage(null);
    try {
      await acceptInvitation(token);
      setState('accepted');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('invitePage.errors.acceptFailed'));
    } finally {
      setIsAccepting(false);
    }
  };

  const emailMismatch =
    state === 'ready' &&
    isAuthenticated &&
    invitation &&
    authUser?.email?.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-4">
        <Link to="/" className="inline-block text-xl font-bold text-text mb-4">
          TMC Studio
        </Link>

        {state === 'loading' && (
          <p className="text-muted">{t('invitePage.loading')}</p>
        )}

        {state === 'not-found' && (
          <>
            <h1 className="text-2xl font-bold">{t('invitePage.notFound.title')}</h1>
            <p className="text-muted">{t('invitePage.notFound.description')}</p>
          </>
        )}

        {state === 'expired' && (
          <>
            <h1 className="text-2xl font-bold">{t('invitePage.expired.title')}</h1>
            <p className="text-muted">{t('invitePage.expired.description')}</p>
          </>
        )}

        {state === 'accepted' && (
          <>
            <h1 className="text-2xl font-bold">{t('invitePage.accepted.title')}</h1>
            <p className="text-muted">
              {t('invitePage.accepted.description', { club: invitation?.organization_name ?? '' })}
            </p>
            <Link
              to="/board"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t('invitePage.goToApp')}
            </Link>
          </>
        )}

        {state === 'ready' && invitation && (
          <>
            <h1 className="text-2xl font-bold">{t('invitePage.ready.title')}</h1>
            <p className="text-muted">
              {t('invitePage.ready.description', {
                club: invitation.organization_name ?? '',
                role: t(`organizationPanel.roles.${invitation.role}`),
                email: invitation.email,
              })}
            </p>

            {errorMessage && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {errorMessage}
              </div>
            )}

            {!isAuthenticated && !authIsLoading && (
              <div className="space-y-2">
                <p className="text-sm text-muted">{t('invitePage.ready.signInPrompt', { email: invitation.email })}</p>
                <Link
                  to="/board"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {t('invitePage.ready.signIn')}
                </Link>
              </div>
            )}

            {isAuthenticated && emailMismatch && (
              <p className="text-sm text-amber-400">
                {t('invitePage.ready.wrongAccount', { invited: invitation.email, current: authUser?.email ?? '' })}
              </p>
            )}

            {isAuthenticated && !emailMismatch && (
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isAccepting ? t('invitePage.ready.accepting') : t('invitePage.ready.accept')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
