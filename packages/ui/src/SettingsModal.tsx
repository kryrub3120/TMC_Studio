/**
 * Settings Modal - User account management
 * TMC Studio - Profile, Security, Billing, Preferences
 */

import { useState, useRef, useEffect } from 'react';
import { Toggle, SettingRow, SegmentedControl, Slider } from './primitives.js';
import { TeamsPanel } from './TeamsPanel.js';
import { useTranslation, LANGUAGES } from './i18n.js';
import { PitchPanel } from './PitchPanel.js';
import type { ArrowType, TeamSettings, TeamSetting, PitchSettings, Team, SquadPlayer } from '@tmc/core';
import { OrganizationPanel, type OrganizationPanelProps } from './OrganizationPanel.js';

export type SettingsTab = 'profile' | 'security' | 'billing' | 'preferences' | 'squad' | 'teams' | 'pitch' | 'club' | 'language' | 'shortcuts' | 'about' | 'data';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'team';
  subscription_expires_at?: string;
}

export type { SquadPlayer } from '@tmc/core';

/** Sidebar nav icons (inline SVG, replaces the previous emoji). */
function NavIcon({ id }: { id: SettingsTab }) {
  const c = { className: 'w-4 h-4 flex-shrink-0', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 } as const;
  switch (id) {
    case 'profile': return (<svg {...c}><circle cx="12" cy="8" r="4" /><path d="M5.5 21a7.5 7.5 0 0 1 13 0" /></svg>);
    case 'security': return (<svg {...c}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
    case 'billing': return (<svg {...c}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>);
    case 'preferences': return (<svg {...c}><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>);
    case 'squad': return (<svg {...c}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6" /><path d="M20 20a6 6 0 0 0-4-5.6" /></svg>);
    case 'teams': return (<svg {...c}><path d="M4 7l4-3 4 2 4-2 4 3-3 3v8H7v-8z" /></svg>);
    case 'pitch': return (<svg {...c}><rect x="3" y="5" width="18" height="14" rx="1" /><line x1="12" y1="5" x2="12" y2="19" /><circle cx="12" cy="12" r="2" /></svg>);
    case 'club': return (<svg {...c}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M10 21v-6h4v6" /></svg>);
    case 'language': return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" /></svg>);
    case 'shortcuts': return (<svg {...c}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></svg>);
    case 'about': return (<svg {...c}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12" y2="8" /></svg>);
    case 'data': return (<svg {...c}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>);
    default: return null;
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tab to show when the modal opens (defaults to 'profile'). */
  initialTab?: SettingsTab;
  user: User | null;
  onUpdateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<void>;
  onUploadAvatar?: (file: File) => Promise<string | null>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
  onManageBilling: () => void;
  onUpgrade: () => void;
  isLoading?: boolean;
  // Preferences
  theme?: 'light' | 'dark';
  gridVisible?: boolean;
  snapEnabled?: boolean;
  gridSize?: number;
  defaultArrowType?: ArrowType;
  stepDuration?: number;
  onToggleTheme?: () => void;
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
  onSetGridSize?: (size: number) => void;
  onSetDefaultArrowType?: (type: ArrowType) => void;
  onSetStepDuration?: (duration: number) => void;
  themeMode?: 'light' | 'dark' | 'system';
  onSetThemeMode?: (mode: 'light' | 'dark' | 'system') => void;
  // Squad bench (Pro feature)
  squad?: SquadPlayer[];
  squadVisible?: boolean;
  isPro?: boolean;
  onAddSquadPlayer?: (name: string, number: number, team: Team) => void;
  onRemoveSquadPlayer?: (id: string) => void;
  /** For future use: inline editing of squad players */
  onUpdateSquadPlayer?: (id: string, updates: Partial<{ name: string; number: number; team: Team }>) => void;
  onSetSquadVisible?: (visible: boolean) => void;
  // Board document settings (moved here from the inspector)
  teamSettings?: TeamSettings;
  onUpdateTeam?: (team: Team, settings: Partial<TeamSetting>) => void;
  pitchSettings?: PitchSettings;
  onUpdatePitch?: (settings: Partial<PitchSettings>) => void;
  isPrintMode?: boolean;
  onTogglePrintMode?: () => void;
  /** Data & privacy */
  onExportBoard?: () => void;
  onImportBoard?: (file: File) => Promise<boolean>;
  /** Club / organization management (Team plan). When provided, adds a 'Club' settings tab. */
  organizationPanelProps?: OrganizationPanelProps;
}

export function SettingsModal({
  isOpen,
  onClose,
  initialTab,
  user,
  onUpdateProfile,
  onUploadAvatar,
  onChangePassword,
  onDeleteAccount,
  onManageBilling,
  onUpgrade,
  isLoading: _isLoading = false,
  theme = 'dark',
  gridVisible = false,
  snapEnabled = true,
  gridSize = 10,
  defaultArrowType = 'pass',
  stepDuration = 0.8,
  onToggleGrid,
  onToggleSnap,
  onSetGridSize,
  onSetDefaultArrowType,
  onSetStepDuration,
  themeMode,
  onSetThemeMode,
  squad = [],
  squadVisible = false,
  isPro = false,
  onAddSquadPlayer,
  onRemoveSquadPlayer,
  onSetSquadVisible,
  teamSettings,
  onUpdateTeam,
  pitchSettings,
  onUpdatePitch,
  isPrintMode,
  onTogglePrintMode,
  onExportBoard,
  onImportBoard,
  organizationPanelProps,
}: SettingsModalProps) {
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab ?? 'profile');

  // Jump to the requested tab whenever the modal is (re)opened.
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab ?? 'profile');
    }
  }, [isOpen, initialTab]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete account form
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const navGroups: { group: string; items: { id: SettingsTab; label: string }[] }[] = [
    { group: 'account', items: [
      { id: 'profile' as SettingsTab, label: t('settings.profile') },
      { id: 'security' as SettingsTab, label: t('settings.security') },
      { id: 'billing' as SettingsTab, label: t('settings.billing') },
    ] },
    // Club & Members gets its own top-level, prominent section - this is a
    // core product feature for the Team plan, not a minor board setting.
    { group: 'club', items: [
      ...(organizationPanelProps ? [{ id: 'club' as SettingsTab, label: t('organizationPanel.title') }] : []),
    ] },
    { group: 'editor', items: [
      { id: 'preferences' as SettingsTab, label: t('settings.preferences') },
      { id: 'squad' as SettingsTab, label: t('settings.squad') },
    ] },
    { group: 'board', items: [
      ...(teamSettings && onUpdateTeam ? [{ id: 'teams' as SettingsTab, label: t('settings.teams') }] : []),
      ...(pitchSettings && onUpdatePitch ? [{ id: 'pitch' as SettingsTab, label: t('settings.pitch') }] : []),
    ] },
    { group: 'general', items: [
      { id: 'language' as SettingsTab, label: t('common.language') },
      { id: 'shortcuts' as SettingsTab, label: t('settings.shortcuts') },
      ...(onExportBoard || onImportBoard ? [{ id: 'data' as SettingsTab, label: t('settings.dataPrivacy') }] : []),
      { id: 'about' as SettingsTab, label: t('settings.about') },
    ] },
  ].filter((g) => g.items.length > 0);

  const getPlanName = (tier: string) => {
    switch (tier) {
      case 'team': return 'Team';
      case 'pro': return 'Pro';
      default: return 'Free';
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'team': return 'bg-purple-500';
      case 'pro': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSaveProfile = async () => {
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError(t('settings.errors.nameRequired'));
      return;
    }

    setIsSavingProfile(true);
    try {
      await onUpdateProfile({ full_name: fullName.trim() });
      setSuccess(t('settings.success.profile'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errors.profileFailed'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword) {
      setError(t('settings.errors.passwordFields'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('settings.errors.passwordLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('settings.errors.passwordsMismatch'));
      return;
    }

    setIsSavingPassword(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setSuccess(t('settings.success.password'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errors.passwordFailed'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);

    if (deleteConfirmText !== 'DELETE') {
      setError(t('settings.errors.typeDelete'));
      return;
    }

    if (!deletePassword) {
      setError(t('settings.errors.passwordRequired'));
      return;
    }

    setIsDeletingAccount(true);
    try {
      await onDeleteAccount(deletePassword);
      // Modal will close automatically after account deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errors.deleteFailed'));
      setIsDeletingAccount(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadAvatar) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('settings.errors.imageFile'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(t('settings.errors.imageSize'));
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);
    try {
      const avatarUrl = await onUploadAvatar(file);
      if (avatarUrl) {
        await onUpdateProfile({ avatar_url: avatarUrl });
        setSuccess(t('settings.success.avatar'));
      } else {
        setError(t('settings.errors.avatarFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errors.avatarFailed'));
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[88vh] overflow-hidden border border-border flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-text">{t('common.settings')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface2 rounded-lg transition-colors"
            aria-label={t('settings.close')}
          >
            <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body: sidebar nav + content */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <nav className="w-44 flex-shrink-0 border-r border-border p-3 overflow-y-auto space-y-4">
            {navGroups.map((grp) => (
              <div key={grp.group}>
                <p className="px-2 mb-1 text-[11px] font-semibold text-muted uppercase tracking-wide">{t(`settings.${grp.group}`)}</p>
                <div className="space-y-0.5">
                  {grp.items.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'bg-accent/10 text-accent font-medium'
                          : 'text-muted hover:text-text hover:bg-surface2'
                      }`}
                    >
                      <NavIcon id={tab.id} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">{t('settings.profileInfo')}</h3>

                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold">
                    {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-2">{t('settings.profilePhoto')}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar || !onUploadAvatar}
                      className="px-3 py-1.5 text-sm bg-surface2 hover:bg-surface2/80 border border-border rounded-lg text-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingAvatar ? t('settings.uploading') : t('settings.uploadPhoto')}
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted mb-1.5">
                    {t('settings.fullName')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('settings.yourName')}
                    className="w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                {/* Email (readonly) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted mb-1.5">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-muted cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-muted">{t('settings.emailReadonly')}</p>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || fullName === user?.full_name}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:bg-surface2 disabled:text-muted text-white rounded-lg transition-colors"
                >
                  {isSavingProfile ? t('settings.saving') : t('settings.saveChanges')}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">{t('settings.changePassword')}</h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">
                      {t('settings.currentPassword')}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('settings.currentPasswordPlaceholder')}
                      className="w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">
                      {t('settings.newPassword')}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('settings.newPasswordPlaceholder')}
                      minLength={8}
                      className="w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">
                      {t('settings.confirmNewPassword')}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('settings.confirmNewPasswordPlaceholder')}
                      minLength={8}
                      className="w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:bg-surface2 disabled:text-muted text-white rounded-lg transition-colors"
                >
                  {isSavingPassword ? t('settings.changing') : t('settings.changePassword')}
                </button>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-red-500/20">
                <h3 className="text-lg font-semibold text-red-400 mb-4">{t('settings.dangerZone')}</h3>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-lg transition-colors"
                  >
                    {t('settings.deleteAccount')}
                  </button>
                ) : (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400 mb-4">
                      {t('settings.deleteWarning')}
                    </p>

                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">
                          {t('settings.typeDelete')}
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted mb-1.5">
                          {t('settings.enterPassword')}
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder={t('settings.yourPassword')}
                          className="w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || deleteConfirmText !== 'DELETE' || !deletePassword}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-surface2 disabled:text-muted text-white rounded-lg transition-colors"
                      >
                        {isDeletingAccount ? t('settings.deleting') : t('settings.deleteMyAccount')}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                          setDeleteConfirmText('');
                          setError(null);
                        }}
                        className="px-4 py-2 bg-surface2 hover:bg-surface2/80 text-text rounded-lg transition-colors"
                      >
                        {t('confirm.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">{t('settings.currentPlan')}</h3>

                <div className="p-6 bg-surface2 border border-border rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold text-text ${getPlanColor(user?.subscription_tier || 'free')}`}>
                        {getPlanName(user?.subscription_tier || 'free')}
                      </span>
                      <span className="text-muted">{t('settings.plan')}</span>
                    </div>

                    {user?.subscription_tier === 'free' && (
                      <button
                        onClick={onUpgrade}
                        className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {t('settings.upgrade')}
                      </button>
                    )}
                  </div>

                  {user?.subscription_expires_at && (
                    <p className="text-sm text-muted">
                      {t('settings.renewsOn', { date: new Date(user.subscription_expires_at).toLocaleDateString(language, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) })}
                    </p>
                  )}
                </div>

                {/* Upgrade Nudge for Free Users */}
                {user?.subscription_tier === 'free' && (
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-accent/20 rounded-lg mb-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-2xl">⭐</div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-text mb-1">
                          {t('settings.freeNudgeTitle')}
                        </h4>
                        <p className="text-xs text-muted mb-3">
                          {t('settings.freeNudgeText')}
                        </p>
                        <button
                          onClick={onUpgrade}
                          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-colors"
                        >
                          {t('settings.upgradeProArrow')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {user?.subscription_tier !== 'free' && (
                  <div>
                    <h4 className="text-sm font-medium text-muted mb-3">{t('settings.manageSubscription')}</h4>
                    <button
                      onClick={onManageBilling}
                      className="flex items-center gap-2 px-4 py-2.5 bg-surface2 hover:bg-surface2/80 border border-border rounded-lg text-text transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{t('settings.openBillingPortal')}</span>
                    </button>
                    <p className="mt-2 text-xs text-muted">
                      {t('settings.billingPortalHint')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              {/* Appearance */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">{t('settings.appearance')}</h3>
                <label className="block text-xs font-medium text-muted mb-2">{t('settings.theme')}</label>
                <SegmentedControl
                  ariaLabel={t('settings.theme')}
                  value={themeMode ?? (theme === 'dark' ? 'dark' : 'light')}
                  onChange={(m) => onSetThemeMode?.(m)}
                  options={[
                    { value: 'light', label: t('settings.light') },
                    { value: 'dark', label: t('settings.dark') },
                    { value: 'system', label: t('settings.system') },
                  ]}
                />
              </div>

              {/* Editor */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">{t('settings.editor')}</h3>
                <div className="divide-y divide-border">
                  <SettingRow
                    label={t('settings.showGrid')}
                    description={t('settings.showGridHint')}
                    control={<Toggle checked={gridVisible} onChange={() => onToggleGrid?.()} ariaLabel={t('settings.showGrid')} />}
                  />
                  <SettingRow
                    label={t('settings.snapGrid')}
                    description={t('settings.snapGridHint')}
                    control={<Toggle checked={snapEnabled} onChange={() => onToggleSnap?.()} ariaLabel={t('settings.snapGrid')} />}
                  />
                </div>
              </div>

              <div>
                <Slider
                  label={t('settings.gridDensity')}
                  value={gridSize}
                  min={5}
                  max={40}
                  step={5}
                  format={(value) => t('settings.pixelsValue', { value })}
                  onChange={(value) => onSetGridSize?.(value)}
                />
                <p className="text-xs text-muted">{t('settings.gridDensityHint')}</p>
              </div>

              {/* Editor defaults */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-2">{t('settings.editorDefaults')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">{t('settings.defaultArrow')}</label>
                    <SegmentedControl
                      ariaLabel={t('settings.defaultArrow')}
                      value={defaultArrowType}
                      onChange={(value) => onSetDefaultArrowType?.(value)}
                      options={[
                        { value: 'pass', label: t('settings.arrowPass') },
                        { value: 'run', label: t('settings.arrowRun') },
                        { value: 'shoot', label: t('settings.arrowShoot') },
                        { value: 'dribble', label: t('settings.arrowDribble') },
                      ]}
                    />
                    <p className="mt-1.5 text-xs text-muted">{t('settings.defaultArrowHint')}</p>
                  </div>

                  <Slider
                    label={t('settings.defaultStepDuration')}
                    value={stepDuration}
                    min={0.2}
                    max={5}
                    step={0.1}
                    format={(value) => t('settings.secondsValue', { value: value.toFixed(1) })}
                    onChange={(value) => onSetStepDuration?.(value)}
                  />
                  <p className="text-xs text-muted">{t('settings.defaultStepDurationHint')}</p>
                </div>
              </div>

              {/* Info footer */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted">
                  {t('settings.preferencesHint')}
                </p>
              </div>
            </div>
          )}

          {/* Squad Tab */}
          {activeTab === 'squad' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">{t('settings.squadRoster')}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted/60">{t('settings.playersCount', { count: squad.length, max: isPro ? 100 : 5 })}</span>
                  {onSetSquadVisible && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm text-muted">{t('settings.showOnBoard')}</span>
                      <Toggle checked={squadVisible} onChange={() => onSetSquadVisible?.(!squadVisible)} ariaLabel={t('settings.showSquadOnBoard')} size="sm" />
                    </label>
                  )}
                </div>
              </div>

              {!isPro ? (
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="text-sm font-medium text-accent mb-1">⭐ {t('settings.proFeature')}</p>
                  <p className="text-xs text-muted">
                    {t('settings.squadFreeHint')}
                  </p>
                  <button
                    onClick={onUpgrade}
                    className="mt-3 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-md transition-colors"
                  >
                    {t('settings.upgradeProArrow')}
                  </button>
                </div>
              ) : squad.length >= 100 ? (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⭐ {t('settings.squadFull')}
                  </p>
                </div>
              ) : (
                <>
                  {/* Add player form */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted mb-1">{t('settings.name')}</label>
                      <input
                        type="text"
                        placeholder={t('settings.playerName')}
                        className="w-full px-3 py-2 bg-surface2 border border-border rounded-lg text-text text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                        id="squad-name-input"
                      />
                    </div>
                    <div className="w-16">
                      <label className="block text-xs font-medium text-muted mb-1">{t('settings.numberShort')}</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        placeholder={t('settings.numberPlaceholder')}
                        className="w-full px-2 py-2 bg-surface2 border border-border rounded-lg text-text text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                        id="squad-number-input"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-muted mb-1">{t('settings.team')}</label>
                      <select
                        className="w-full px-2 py-2 bg-surface2 border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        id="squad-team-select"
                      >
                        <option value="home">{t('teamsPanel.team1')}</option>
                        <option value="away">{t('teamsPanel.team2')}</option>
                        <option value="team3">{t('teamsPanel.team3')}</option>
                        <option value="team4">{t('teamsPanel.team4')}</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('squad-name-input') as HTMLInputElement;
                        const numInput = document.getElementById('squad-number-input') as HTMLInputElement;
                        const teamSelect = document.getElementById('squad-team-select') as HTMLSelectElement;
                        const name = nameInput?.value?.trim();
                        const num = parseInt(numInput?.value || '0', 10);
                        const team = (teamSelect?.value || 'home') as Team;
                        if (name && num > 0 && onAddSquadPlayer) {
                          onAddSquadPlayer(name, num, team);
                          nameInput.value = '';
                          numInput.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                    >
                      {t('settings.add')}
                    </button>
                  </div>

                  {/* Player list */}
                  <div className="space-y-1 max-h-60 overflow-y-auto border border-border rounded-lg p-2">
                    {squad.length === 0 ? (
                      <p className="text-sm text-muted text-center py-4">
                        {t('settings.noPlayers')}
                      </p>
                    ) : (
                      squad.map((player) => {
                        const teamColor = player.team === 'home' ? 'bg-team-home'
                          : player.team === 'away' ? 'bg-team-away'
                          : player.team === 'team3' ? 'bg-emerald-500'
                          : 'bg-orange-500';
                        const teamLabel = player.team === 'home' ? t('teamsPanel.team1')
                          : player.team === 'away' ? t('teamsPanel.team2')
                          : player.team === 'team3' ? t('teamsPanel.team3')
                          : t('teamsPanel.team4');
                        return (
                          <div
                            key={player.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface2 hover:bg-border transition-colors group"
                          >
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${teamColor} text-white`}>
                              {player.number}
                            </span>
                            <span className="text-sm text-text flex-1 truncate">{player.name}</span>
                            <span className="text-[10px] text-muted uppercase">{teamLabel}</span>
                          {/* Delete */}
                          {onRemoveSquadPlayer && (
                            <button
                              onClick={() => onRemoveSquadPlayer(player.id)}
                              className="p-1 rounded text-muted hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                              aria-label={t('settings.removePlayer', { name: player.name })}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                        );
                      })
                    )}
                  </div>

                  <p className="text-xs text-muted">
                    {t('settings.squadTip')}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && teamSettings && onUpdateTeam && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">{t('settings.teams')}</h3>
              <TeamsPanel teamSettings={teamSettings} onUpdateTeam={onUpdateTeam} />
            </div>
          )}

          {/* Pitch Tab */}
          {activeTab === 'pitch' && pitchSettings && onUpdatePitch && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">{t('settings.pitch')}</h3>
              <PitchPanel pitchSettings={pitchSettings} onUpdatePitch={onUpdatePitch} isPrintMode={isPrintMode} onTogglePrintMode={onTogglePrintMode} />
            </div>
          )}

          {/* Club Tab */}
          {activeTab === 'club' && organizationPanelProps && (
            <OrganizationPanel {...organizationPanelProps} />
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-2">{t('common.language')}</h3>
              <p className="text-xs text-muted mb-4">{t('settings.languageHint')}</p>
              <SegmentedControl
                ariaLabel={t('common.language')}
                value={language}
                onChange={(l) => setLanguage(l)}
                options={LANGUAGES.map((l) => ({ value: l, label: t(`languages.${l}`) }))}
              />
            </div>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">{t('settings.keyboardShortcuts')}</h3>
              <div>
                {[
                  ['P / Shift+P', t('settings.shortcutItems.players')],
                  ['B', t('settings.shortcutItems.ball')],
                  ['A / R / S / D', t('settings.shortcutItems.arrows')],
                  ['Z / Shift+Z', t('settings.shortcutItems.zones')],
                  ['T', t('settings.shortcutItems.text')],
                  ['K / Q', t('settings.shortcutItems.equipment')],
                  ['Shift+G', t('settings.shortcutItems.goalkeeper')],
                  ['1–6 / Shift+1–6', t('settings.shortcutItems.formations')],
                  ['F', t('settings.shortcutItems.focus')],
                  ['?', t('settings.shortcutItems.fullShortcuts')],
                ].map(([k, d]) => (
                  <div key={k} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <span className="text-sm text-text">{d}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-surface2 border border-border text-xs text-muted font-mono">{k}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-1">TMC Studio</h3>
              <p className="text-xs text-muted mb-5">{t('settings.aboutVersion')}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { label: 'X', href: 'https://x.com/tmcstudio' },
                  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/tmcstudio' },
                  { label: 'GitHub', href: 'https://github.com/tmcstudio' },
                  { label: t('settings.contact'), href: 'mailto:support@tacticsmadeclear.store' },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-md bg-surface2 border border-border text-sm text-text hover:border-accent hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted">© {new Date().getFullYear()} TMC Studio. {t('settings.rights')}</p>
            </div>
          )}

          {/* Data & privacy Tab */}
          {activeTab === 'data' && (
            <div>
              <h3 className="text-lg font-semibold text-text mb-2">{t('settings.dataPrivacy')}</h3>
              <p className="text-xs text-muted mb-4">{t('settings.dataHint')}</p>
              <div className="flex flex-wrap gap-2">
                {onExportBoard && (
                  <button
                    onClick={() => onExportBoard()}
                    className="px-3 py-2 rounded-md bg-surface2 border border-border text-sm text-text hover:border-accent hover:text-accent transition-colors"
                  >
                    {t('settings.exportBoard')}
                  </button>
                )}
                {onImportBoard && (
                  <label className="px-3 py-2 rounded-md bg-surface2 border border-border text-sm text-text hover:border-accent hover:text-accent transition-colors cursor-pointer">
                    {t('settings.importBoard')}
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        const input = e.currentTarget;
                        if (!file || !onImportBoard) return;
                        setError(null);
                        setSuccess(null);
                        const ok = await onImportBoard(file);
                        if (ok) setSuccess(t('settings.importSuccess'));
                        else setError(t('settings.importInvalid'));
                        input.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted mt-4">{t('settings.importWarning')}</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
