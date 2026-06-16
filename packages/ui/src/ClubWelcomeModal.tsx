/**
 * ClubWelcomeModal - Welcome flow for first-time Club Premium admin
 * Shows a 3-step onboarding: Name your team → Invite member → You're all set!
 * Appears once after first login with Club Premium (subscription_tier === 'team')
 * and no members added yet (only admin exists).
 */

import React, { useState } from 'react';
import { useTranslation } from './i18n.js';

export interface ClubWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  /** Callback to create/update team name */
  onSaveTeamName: (name: string) => Promise<void>;
  /** Callback to open Team panel for inviting members */
  onOpenTeamPanel: () => void;
  /** Current team name if already set */
  currentTeamName?: string;
}

type WelcomeStep = 'name-team' | 'invite' | 'complete';

export const ClubWelcomeModal: React.FC<ClubWelcomeModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onSaveTeamName,
  onOpenTeamPanel,
  currentTeamName,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<WelcomeStep>('name-team');
  const [teamName, setTeamName] = useState(currentTeamName ?? '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleNameTeam = async () => {
    if (!teamName.trim()) return;
    setSaving(true);
    try {
      await onSaveTeamName(teamName.trim());
      setStep('invite');
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-[#050A16]/70 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={t('club.welcome.title')}
    >
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden animate-fade-in">
        {/* Header progress dots */}
        <div className="flex gap-1.5 px-6 pt-4">
          {(['name-team', 'invite', 'complete'] as const).map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step === s || (step === 'invite' && s === 'name-team') || (step === 'complete' && s !== 'complete')
                  ? 'bg-accent'
                  : step === 'complete'
                    ? 'bg-accent'
                    : 'bg-surface2'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Name your team */}
        {step === 'name-team' && (
          <div className="px-6 py-5 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h2 className="text-lg font-semibold text-text">{t('club.welcome.title')}</h2>
              <p className="text-sm text-muted mt-1">{t('club.welcome.subtitle')}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                {t('club.welcome.nameTeamLabel')}
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={t('club.welcome.nameTeamPlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && handleNameTeam()}
                autoFocus
                maxLength={60}
                className="w-full px-3 py-2 rounded-md bg-bg border border-border text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-xs text-muted hover:text-text transition-colors"
              >
                {t('club.welcome.skip')}
              </button>
              <button
                onClick={handleNameTeam}
                disabled={!teamName.trim() || saving}
                className="px-4 py-2 rounded-md bg-accent text-[#062016] text-xs font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? t('common.saving') : t('club.welcome.continue')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Invite member */}
        {step === 'invite' && (
          <div className="px-6 py-5 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h2 className="text-lg font-semibold text-text">{t('club.welcome.inviteTitle')}</h2>
              <p className="text-sm text-muted mt-1">{t('club.welcome.inviteDescription')}</p>
            </div>

            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{t('club.welcome.teamPanelHint')}</p>
                  <p className="text-xs text-muted mt-0.5">{t('club.welcome.teamPanelDesc')}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onOpenTeamPanel();
                setStep('complete');
              }}
              className="w-full px-4 py-2.5 rounded-md bg-accent text-[#062016] text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              {t('club.welcome.openTeamPanel')}
            </button>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-xs text-muted hover:text-text transition-colors"
              >
                {t('club.welcome.skip')}
              </button>
              <button
                onClick={() => setStep('complete')}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                {t('club.welcome.doLater')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <div className="px-6 py-5 space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h2 className="text-lg font-semibold text-text">{t('club.welcome.completeTitle')}</h2>
              <p className="text-sm text-muted mt-1">{t('club.welcome.completeDescription')}</p>
            </div>

            <div className="space-y-2">
              {[
                t('club.welcome.benefitUnlimited'),
                t('club.welcome.benefitExport'),
                t('club.welcome.benefitMembers'),
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text">
                  <span className="text-accent">✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="w-full px-4 py-2.5 rounded-md bg-accent text-[#062016] text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              {t('club.welcome.startCoaching')}
            </button>
          </div>
        )}

        {/* Footer branding */}
        <div className="px-6 py-3 bg-bg/50 border-t border-border text-center">
          <span className="text-[10px] text-muted/60">TMC Studio — Club Premium</span>
        </div>
      </div>
    </div>
  );
};

export default ClubWelcomeModal;