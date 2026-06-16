/**
 * Organization (Club) Panel
 * TMC Studio - Settings tab for managing a club's members and invitations.
 *
 * Pure presentational component: all data fetching / mutation happens via
 * the callbacks passed in (see apps/web/src/hooks/useOrganization.ts).
 *
 * Access within a club is binary: you're either the 'owner' (who manages
 * members, invitations and the club itself) or a plain 'member' (who gets
 * access to the club's shared projects). There's no separate admin/coach
 * distinction - it never gated anything in the UI.
 */

import { useState } from 'react';
import { Section, Field, inputClass, SettingRow } from './primitives.js';
import { Button } from './Button.js';
import { useTranslation } from './i18n.js';

export type OrgRole = 'owner' | 'member';
/** Invitations always create plain members - only owners send invites. */
export type InvitationRole = 'member';

export interface OrganizationMemberView {
  id: string;
  userId: string;
  role: OrgRole;
  email?: string;
  fullName?: string | null;
  isSelf?: boolean;
}

export interface InvitationView {
  id: string;
  email: string;
  role: InvitationRole;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
}

export interface OrganizationPanelProps {
  /** Whether the current plan allows inviting members (team plan). */
  isEnabled: boolean;
  organization: { id: string; name: string } | null;
  role: OrgRole | null;
  members: OrganizationMemberView[];
  invitations: InvitationView[];
  maxSeats: number;
  seatUsage: number;
  isLoading?: boolean;
  error?: string | null;
  onCreateOrganization: (name: string) => Promise<void>;
  onInvite: (email: string) => Promise<void>;
  onRevokeInvitation: (invitationId: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  /** Owner-only: hand the 'owner' role to another existing member. */
  onTransferOwnership: (newOwnerUserId: string) => Promise<void>;
  /** Owner-only, sole-member case: permanently delete the club. */
  onDeleteOrganization: () => Promise<void>;
  /** Build a shareable accept-invitation link from a token. */
  getInviteLink: (token: string) => string;
  onUpgrade?: () => void;
}

export function OrganizationPanel({
  isEnabled,
  organization,
  role,
  members,
  invitations,
  maxSeats,
  seatUsage,
  isLoading = false,
  error = null,
  onCreateOrganization,
  onInvite,
  onRevokeInvitation,
  onRemoveMember,
  onTransferOwnership,
  onDeleteOrganization,
  getInviteLink,
  onUpgrade,
}: OrganizationPanelProps) {
  const { t } = useTranslation();

  const [clubName, setClubName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Owner-leaves-club flow: either transfer ownership to another member,
  // or (if the owner is the only member) delete the club entirely.
  const [transferTargetId, setTransferTargetId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showTransferPicker, setShowTransferPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isOwner = role === 'owner';
  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const atSeatLimit = maxSeats !== Infinity && seatUsage >= maxSeats;
  const otherMembers = members.filter((m) => !m.isSelf);
  const selfMember = members.find((m) => m.isSelf);

  // ─── Locked: not on the Team plan ───────────────────────────────────
  if (!isEnabled) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text">{t('organizationPanel.title')}</h3>
        <div className="rounded-lg border border-border bg-surface2 p-4 space-y-3">
          <p className="text-sm text-text">{t('organizationPanel.upsell.description')}</p>
          {onUpgrade && (
            <Button onClick={onUpgrade} variant="primary" size="sm">
              {t('organizationPanel.upsell.cta')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── No organization yet: create one ────────────────────────────────
  if (!organization) {
    const handleCreate = async () => {
      if (!clubName.trim()) return;
      setLocalError(null);
      setIsCreating(true);
      try {
        await onCreateOrganization(clubName.trim());
        setClubName('');
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : t('organizationPanel.errors.createFailed'));
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text">{t('organizationPanel.title')}</h3>
        <p className="text-sm text-muted">{t('organizationPanel.create.description')}</p>

        <div className="rounded-lg border border-border bg-surface2 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-text uppercase tracking-wide">{t('organizationPanel.intro.title')}</p>
          <p className="text-sm text-muted">{t('organizationPanel.intro.step1')}</p>
          <p className="text-sm text-muted">{t('organizationPanel.intro.step2')}</p>
          <p className="text-sm text-muted">{t('organizationPanel.intro.step3')}</p>
        </div>

        {(localError || error) && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {localError ?? error}
          </div>
        )}
        <Field label={t('organizationPanel.create.nameLabel')}>
          <div className="flex gap-2">
            <input
              type="text"
              className={inputClass}
              placeholder={t('organizationPanel.create.namePlaceholder')}
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              maxLength={100}
            />
            <Button onClick={handleCreate} disabled={isCreating || !clubName.trim()} variant="primary" size="sm">
              {isCreating ? t('organizationPanel.create.creating') : t('organizationPanel.create.cta')}
            </Button>
          </div>
        </Field>
      </div>
    );
  }

  // ─── Existing organization, but the current user is just a member ───
  // Owners get the full management UI below; plain members just need a
  // clear confirmation that they belong to the club and have access.
  if (!isOwner) {
    const handleLeave = async () => {
      if (!selfMember) return;
      setLocalError(null);
      setIsLeaving(true);
      try {
        await onRemoveMember(selfMember.id);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : t('organizationPanel.errors.leaveFailed'));
        setIsLeaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text">{organization.name}</h3>

        {(localError || error) && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {localError ?? error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface2 p-4 space-y-2">
          <p className="text-sm font-medium text-text">
            {t('organizationPanel.memberAccess.title', { club: organization.name })}
          </p>
          <p className="text-sm text-muted">{t('organizationPanel.memberAccess.description')}</p>
        </div>

        {selfMember && (
          <button
            onClick={handleLeave}
            disabled={isLeaving}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
          >
            {isLeaving ? t('organizationPanel.members.leaving') : t('organizationPanel.members.leave')}
          </button>
        )}

        {isLoading && <p className="text-xs text-muted">{t('common.loading')}</p>}
      </div>
    );
  }

  // ─── Existing organization, owner view ───────────────────────────────
  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setLocalError(null);
    setIsInviting(true);
    try {
      await onInvite(email);
      setInviteEmail('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('organizationPanel.errors.inviteFailed'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTargetId) return;
    setLocalError(null);
    setIsTransferring(true);
    try {
      await onTransferOwnership(transferTargetId);
      setShowTransferPicker(false);
      setTransferTargetId('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('organizationPanel.errors.transferFailed'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteClub = async () => {
    setLocalError(null);
    setIsDeleting(true);
    try {
      await onDeleteOrganization();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t('organizationPanel.errors.deleteFailed'));
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = getInviteLink(token);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((cur) => (cur === token ? null : cur)), 2000);
    } catch {
      // Clipboard not available — ignore, link is shown inline instead.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text">{organization.name}</h3>
        <p className="text-xs text-muted mt-0.5">
          {t('organizationPanel.seats', { used: seatUsage, max: maxSeats === Infinity ? '∞' : maxSeats })}
        </p>
      </div>

      {(localError || error) && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {localError ?? error}
        </div>
      )}

      {/* How it works (collapsed reminder) */}
      <Section title={t('organizationPanel.intro.title')}>
        <div className="space-y-1.5">
          <p className="text-sm text-muted">{t('organizationPanel.intro.step1')}</p>
          <p className="text-sm text-muted">{t('organizationPanel.intro.step2')}</p>
          <p className="text-sm text-muted">{t('organizationPanel.intro.step3')}</p>
        </div>
      </Section>

      {/* Members */}
      <Section title={t('organizationPanel.members.title')} defaultOpen>
        <div className="space-y-1">
          {members.map((member) => (
            <SettingRow
              key={member.id}
              label={member.fullName || member.email || member.userId}
              description={member.email && member.fullName ? member.email : undefined}
              control={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted px-2 py-1 rounded-md bg-surface2">
                    {t(`organizationPanel.roles.${member.role}`)}
                  </span>
                  {member.role !== 'owner' ? (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
                      title={member.isSelf ? t('organizationPanel.members.leave') : t('organizationPanel.members.remove')}
                    >
                      {member.isSelf ? t('organizationPanel.members.leave') : t('organizationPanel.members.remove')}
                    </button>
                  ) : null}
                </div>
              }
            />
          ))}
        </div>

        {/* Owner "leave" flow: transfer ownership first, or delete the club
            if it has no other members. The owner role itself can never be
            removed directly (enforced by a DB trigger). */}
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {otherMembers.length > 0 ? (
            showTransferPicker ? (
              <div className="flex items-center gap-2">
                <select
                  className={`${inputClass} flex-1 py-1.5`}
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                >
                  <option value="">{t('organizationPanel.members.transferSelect')}</option>
                  {otherMembers.map((m) => (
                    <option key={m.id} value={m.userId}>{m.fullName || m.email || m.userId}</option>
                  ))}
                </select>
                <Button
                  onClick={handleTransferOwnership}
                  disabled={isTransferring || !transferTargetId}
                  variant="primary"
                  size="sm"
                >
                  {isTransferring ? t('organizationPanel.members.transferring') : t('organizationPanel.members.transferConfirm')}
                </Button>
                <button
                  onClick={() => { setShowTransferPicker(false); setTransferTargetId(''); }}
                  className="text-xs text-muted hover:text-text px-2 py-1"
                >
                  {t('organizationPanel.members.cancel')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTransferPicker(true)}
                className="text-xs text-accent hover:underline px-2 py-1"
              >
                {t('organizationPanel.members.transferOwnership')}
              </button>
            )
          ) : showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">{t('organizationPanel.members.deleteClubConfirm')}</span>
              <button
                onClick={handleDeleteClub}
                disabled={isDeleting}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors font-medium"
              >
                {isDeleting ? t('organizationPanel.members.deleting') : t('organizationPanel.members.deleteClubConfirmCta')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-muted hover:text-text px-2 py-1"
              >
                {t('organizationPanel.members.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
            >
              {t('organizationPanel.members.deleteClub')}
            </button>
          )}
        </div>
      </Section>

      {/* Invite (owner only) */}
      <Section title={t('organizationPanel.invite.title')} defaultOpen>
        <div className="space-y-3">
          {atSeatLimit ? (
            <div className="rounded-lg border border-border bg-surface2 p-3 text-sm text-muted">
              {t('organizationPanel.invite.seatLimitReached')}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                className={inputClass}
                placeholder={t('organizationPanel.invite.emailPlaceholder')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} variant="primary" size="sm">
                {isInviting ? t('organizationPanel.invite.sending') : t('organizationPanel.invite.cta')}
              </Button>
            </div>
          )}

          {/* Pending invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">
                {t('organizationPanel.invite.pending')}
              </p>
              {pendingInvitations.map((inv) => (
                <SettingRow
                  key={inv.id}
                  label={inv.email}
                  description={t('organizationPanel.roles.member')}
                  control={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(inv.token)}
                        className="text-xs text-accent hover:underline px-2 py-1"
                      >
                        {copiedToken === inv.token
                          ? t('organizationPanel.invite.linkCopied')
                          : t('organizationPanel.invite.copyLink')}
                      </button>
                      <button
                        onClick={() => onRevokeInvitation(inv.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
                      >
                        {t('organizationPanel.invite.revoke')}
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </Section>

      {isLoading && <p className="text-xs text-muted">{t('common.loading')}</p>}
    </div>
  );
}
