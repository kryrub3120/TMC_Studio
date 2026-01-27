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

import { useCallback } from 'react';
import { updateProfile, changePassword, deleteAccount } from '../lib/supabase';
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
  const authUser = useAuthStore((s) => s.user);

  /**
   * Update user profile (name, avatar URL)
   * Refreshes auth state after successful update
   */
  const handleUpdateProfile = useCallback(async (updates: { full_name?: string; avatar_url?: string }) => {
    try {
      await updateProfile(updates);
      await useAuthStore.getState().initialize();
      showToast('Profile updated ✓');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }, [showToast]);

  /**
   * Upload avatar image to Supabase storage
   * Returns public URL of uploaded avatar
   */
  const handleUploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!authUser) return null;
    try {
      const { uploadAvatar } = await import('../lib/supabase');
      const avatarUrl = await uploadAvatar(authUser.id, file);
      return avatarUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
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
      showToast('Password changed ✓');
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }, [showToast]);

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
      showToast('Account deleted. Goodbye! 👋');
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  }, [showToast, onCloseModal]);

  return {
    updateProfile: handleUpdateProfile,
    uploadAvatar: handleUploadAvatar,
    changePassword: handleChangePassword,
    deleteAccount: handleDeleteAccount,
  };
}
