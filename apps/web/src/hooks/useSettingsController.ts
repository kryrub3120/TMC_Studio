/**
 * PR-REFACTOR-5: Settings Controller Hook
 * 
 * Manages user account settings operations:
 * - Profile updates (name, avatar)
 * - Avatar upload to Supabase storage
 * - Password changes
 * - Account deletion
 * 
 * Extracts ~45 lines from App.tsx
 */

import { logger } from '../lib/logger';
import { useCallback } from 'react';
import { useTranslation } from '@tmc/ui';
import { updateProfile, changePassword, deleteAccount, uploadAvatar } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

interface UseSettingsControllerOptions {
  onCloseModal?: () => void;
  showToast: (message: string) => void;
}

interface SettingsController {
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

/**
 * Settings controller hook - Account management operations
 * 
 * @param options.onCloseModal - Callback to close settings modal after successful operations
 * @param options.showToast - Callback to show toast notifications
 * @returns Controller with settings handlers
 */
export function useSettingsController(options: UseSettingsControllerOptions): SettingsController {
  const { onCloseModal, showToast } = options;
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);

  /**
   * Update user profile (name, avatar URL)
   * Refreshes auth state after successful update
   */
  const handleUpdateProfile = useCallback(async (updates: { full_name?: string; avatar_url?: string }) => {
    try {
      await updateProfile(updates);
      await useAuthStore.getState().initialize();
      showToast(t('settingsToast.profileUpdated'));
    } catch (error) {
      logger.error('Profile update error:', error);
      throw error;
    }
  }, [showToast, t]);

  /**
   * Upload avatar image to Supabase storage
   * Returns public URL of uploaded avatar
   */
  const handleUploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!authUser) return null;
    try {
      const avatarUrl = await uploadAvatar(authUser.id, file);
      return avatarUrl;
    } catch (error) {
      logger.error('Avatar upload error:', error);
      return null;
    }
  }, [authUser]);

  /**
   * Change user password
   * Requires current password for verification
   */
  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await changePassword(currentPassword, newPassword);
      showToast(t('settingsToast.passwordChanged'));
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }, [showToast, t]);

  /**
   * Delete user account permanently
   * Closes settings modal and shows goodbye message
   * Requires password for confirmation
   */
  const handleDeleteAccount = useCallback(async (password: string) => {
    try {
      await deleteAccount(password);
      if (onCloseModal) {
        onCloseModal();
      }
      showToast(t('settingsToast.accountDeleted'));
    } catch (error) {
      logger.error('Account deletion error:', error);
      throw error;
    }
  }, [showToast, onCloseModal, t]);

  return {
    updateProfile: handleUpdateProfile,
    uploadAvatar: handleUploadAvatar,
    changePassword: handleChangePassword,
    deleteAccount: handleDeleteAccount,
  };
}
