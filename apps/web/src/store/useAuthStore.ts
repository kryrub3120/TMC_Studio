/**
 * Auth Store - Zustand
 * TMC Studio - Authentication state management
 * 
 * SIMPLIFIED VERSION - let Supabase handle OAuth automatically
 */

import { logger } from '../lib/logger';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  isSupabaseEnabled,
  getCurrentUser,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  signInWithGoogle as supabaseSignInWithGoogle,
  onAuthStateChange,
  supabase,
  type User,
} from '../lib/supabase';

interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  
  // Computed
  isAuthenticated: boolean;
  isPro: boolean;
  isTeam: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      isAuthenticated: false,
      isPro: false,
      isTeam: false,

      // Initialize auth - call on app startup (EVENT-BASED, NON-BLOCKING)
      initialize: async () => {
        logger.debug('[Auth] Initialize started (event-based)');
        
        if (!isSupabaseEnabled() || !supabase) {
          logger.debug('[Auth] Supabase disabled - using offline mode');
          set({ isInitialized: true, isLoading: false });
          return;
        }

        // ✅ UI starts IMMEDIATELY - no blocking
        set({ isInitialized: true, isLoading: false });

        try {
          // Check if OAuth callback (has hash with access_token)
          const hasOAuthHash = window.location.hash && window.location.hash.includes('access_token');
          
          if (hasOAuthHash) {
            logger.debug('[Auth] OAuth callback detected - will clean URL after processing');
          }

          // ✅ Setup listener for future auth changes
          logger.debug('[Auth] Setting up auth listener...');
          onAuthStateChange(async (user) => {
            logger.debug('[Auth] State changed - user:', user?.email ?? 'none');
            
            set({
              user,
              isAuthenticated: !!user,
              isPro: user?.subscription_tier === 'pro' || user?.subscription_tier === 'team',
              isTeam: user?.subscription_tier === 'team',
            });

            // Load preferences from cloud if user is authenticated
            if (user) {
              logger.debug('[Auth] Loading preferences from cloud...');
              try {
                const { getPreferences } = await import('../lib/supabase');
                const cloudPrefs = await getPreferences();
                if (cloudPrefs) {
                  const { useUIStore } = await import('./useUIStore');
                  // Merge cloud preferences with local (cloud takes precedence)
                  if (cloudPrefs.theme) useUIStore.getState().setTheme(cloudPrefs.theme);
                  if (cloudPrefs.gridVisible !== undefined) useUIStore.setState({ gridVisible: cloudPrefs.gridVisible });
                  if (cloudPrefs.snapEnabled !== undefined) useUIStore.setState({ snapEnabled: cloudPrefs.snapEnabled });
                  logger.debug('[Auth] Preferences loaded from cloud');
                }
              } catch (error) {
                logger.error('[Auth] Failed to load preferences:', error);
              }

              // PR-UX-1: Check for unsaved guest work and offer to save to cloud
              try {
                const { useBoardStore } = await import('./index');
                const boardState = useBoardStore.getState();
                const hasLocalWork = boardState.document.steps[0]?.elements.length > 0;
                const notSavedToCloud = !boardState.cloudProjectId;
                
                if (hasLocalWork && notSavedToCloud) {
                  logger.debug('[Auth] Detected unsaved guest work - prompting user to save');
                  
                  // Small delay to let UI update first
                  setTimeout(async () => {
                    const { useUIStore } = await import('./useUIStore');
                    
                    useUIStore.getState().showConfirmModal({
                      title: '💾 Save Your Work?',
                      description: 'You have unsaved work from your guest session. Would you like to save it to your cloud account?',
                      confirmLabel: 'Save to Cloud',
                      cancelLabel: 'Discard',
                      danger: false,
                      onConfirm: async () => {
                        logger.debug('[Auth] User confirmed - saving guest work to cloud...');
                        const success = await boardState.saveToCloud();
                        
                        if (success) {
                          await boardState.fetchCloudProjects();
                          logger.debug('[Auth] ✓ Guest work saved to cloud');
                          
                          // Show success toast
                          useUIStore.getState().showToast('✓ Your work has been saved to the cloud!');
                        } else {
                          logger.error('[Auth] ✗ Failed to save guest work');
                          useUIStore.getState().showToast('⚠️ Failed to save. Try Cmd+S to save manually.');
                        }
                        useUIStore.getState().closeConfirmModal();
                      },
                    });
                  }, 500);
                }
              } catch (error) {
                logger.error('[Auth] Error checking for guest work:', error);
              }
            }

            // Clean OAuth hash from URL after successful login
            if (hasOAuthHash && user) {
              logger.debug('[Auth] Cleaning OAuth hash from URL');
              window.history.replaceState(null, '', window.location.pathname);
            }
          });
          
          logger.debug('[Auth] Listener active');

          // ✅ Check for existing session ONLY if NOT OAuth callback
          // (OAuth hash will be processed by Supabase and trigger onAuthStateChange)
          if (!hasOAuthHash) {
            logger.debug('[Auth] Checking for existing session...');
            try {
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session?.user) {
                logger.debug('[Auth] Existing session found:', session.user.email);
                const user = await getCurrentUser();
                if (user) {
                  logger.debug('[Auth] User profile loaded:', user.email);
                  set({
                    user,
                    isAuthenticated: true,
                    isPro: user.subscription_tier === 'pro' || user.subscription_tier === 'team',
                    isTeam: user.subscription_tier === 'team',
                  });

                  // Load preferences for existing session
                  try {
                    const { getPreferences } = await import('../lib/supabase');
                    const cloudPrefs = await getPreferences();
                    if (cloudPrefs) {
                      const { useUIStore } = await import('./useUIStore');
                      if (cloudPrefs.theme) useUIStore.getState().setTheme(cloudPrefs.theme);
                      if (cloudPrefs.gridVisible !== undefined) useUIStore.setState({ gridVisible: cloudPrefs.gridVisible });
                      if (cloudPrefs.snapEnabled !== undefined) useUIStore.setState({ snapEnabled: cloudPrefs.snapEnabled });
                      logger.debug('[Auth] Preferences loaded from cloud');
                    }
                  } catch (error) {
                    logger.error('[Auth] Failed to load preferences:', error);
                  }
                }
              } else {
                logger.debug('[Auth] No existing session');
              }
            } catch (error) {
              // Ignore AbortError - it's expected during OAuth processing
              if (error instanceof Error && error.name === 'AbortError') {
                logger.debug('[Auth] AbortError (expected during OAuth) - ignored');
              } else {
                logger.error('[Auth] Session check error:', error);
              }
            }
          } else {
            logger.debug('[Auth] Skipping session check - OAuth callback will be handled by listener');
          }
          
        } catch (error) {
          logger.error('[Auth] Initialization error:', error);
          set({
            error: 'Failed to initialize authentication',
          });
        }
      },

      // Sign in with email/password
      signIn: async (email: string, password: string) => {
        if (!isSupabaseEnabled()) {
          set({ error: 'Authentication not available in offline mode' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          await supabaseSignIn(email, password);
          const user = await getCurrentUser();
          set({
            user,
            isAuthenticated: !!user,
            isPro: user?.subscription_tier === 'pro' || user?.subscription_tier === 'team',
            isTeam: user?.subscription_tier === 'team',
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign in failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      // Sign up with email/password
      signUp: async (email: string, password: string, fullName?: string) => {
        if (!isSupabaseEnabled()) {
          set({ error: 'Authentication not available in offline mode' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          await supabaseSignUp(email, password, fullName);
          set({
            isLoading: false,
            error: null,
          });
          // Note: User needs to verify email, so don't set authenticated yet
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign up failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      // Sign in with Google
      signInWithGoogle: async () => {
        if (!isSupabaseEnabled()) {
          set({ error: 'Authentication not available in offline mode' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          logger.debug('[Auth] Starting Google sign in...');
          
          // H4: Save current work to localStorage BEFORE OAuth redirect
          // This prevents loss of unsaved work during the redirect flow
          try {
            const { useBoardStore } = await import('./index');
            useBoardStore.getState().saveDocument();
            logger.debug('[Auth] Board state saved before OAuth redirect');
          } catch (e) {
            logger.error('[Auth] Failed to save before redirect:', e);
          }
          
          await supabaseSignInWithGoogle();
          // Redirect will happen, state will be set after return
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Google sign in failed';
          logger.error('[Auth] Google sign in error:', error);
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        set({ isLoading: true, error: null });

        try {
          await supabaseSignOut();
          set({
            user: null,
            isAuthenticated: false,
            isPro: false,
            isTeam: false,
            isLoading: false,
          });
          logger.debug('[Auth] Successfully signed out');

          // PR-B1: Post-Logout Data Cleanup
          // Clear board state and remove any previous user data
          try {
            const { useBoardStore } = await import('./index');
            const boardState = useBoardStore.getState();
            
            // 1. Reset board to blank document (also resets cloudProjectId to null)
            boardState.newDocument();
            
            // 2. Clear persisted board document from localStorage
            localStorage.removeItem('tmc-studio-board');
            
            // 3. Clear any active autosave timer
            boardState.clearAutoSaveTimer();
            
            logger.debug('[Auth] Board state cleaned up after logout');
          } catch (error) {
            logger.error('[Auth] Failed to clean up board state:', error);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign out failed';
          logger.error('[Auth] Sign out error:', error);
          set({ isLoading: false, error: message });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'tmc-auth',
      partialize: (state) => ({
        // Only persist non-sensitive data
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Auto-initialize on import - ALWAYS run, don't check isInitialized
if (typeof window !== 'undefined') {
  // Defer initialization slightly to let Supabase client process any OAuth hash
  setTimeout(() => {
    logger.debug('[Auth] Auto-init triggered');
    const { initialize } = useAuthStore.getState();
    initialize();
  }, 100);
}
