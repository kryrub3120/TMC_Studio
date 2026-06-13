/**
 * Auth Store - Zustand
 * TMC Studio - Authentication state management
 * 
 * SIMPLIFIED VERSION - let Supabase handle OAuth automatically
 */

import { logger } from '../lib/logger';
// DEV-ONLY: see ../lib/devCloud.ts
import { setDevCloudUser, clearDevCloudData, clearAllDevCloudData, isDevCloudActive } from '../lib/devCloud';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translate as t } from '@tmc/ui';
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
  /** DEV-ONLY: true when the current session was created via devLogin()
   *  (test login button), not via real Supabase auth. */
  isMockUser: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  /** DEV-ONLY: instantly "log in" as a fake user with the given plan,
   *  without going through Google/Supabase. Used by the "Test login"
   *  buttons (only rendered when import.meta.env.DEV is true). */
  devLogin: (tier: 'guest' | 'free' | 'pro' | 'team') => void;
  /** DEV-ONLY: clear a mock session created via devLogin(). */
  devLogout: () => void;
  /** DEV-ONLY: wipe this mock user's devCloud projects/folders and reset the board. */
  devClearData: () => void;
  /** DEV-ONLY: wipe devCloud projects/folders for ALL test tiers (free/pro/team).
   *  Useful for long test sessions where other tiers' data accumulates. */
  devClearAllTiers: () => void;

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
      isMockUser: false,
      isAuthenticated: false,
      isPro: false,
      isTeam: false,

      // Initialize auth - call on app startup (EVENT-BASED, NON-BLOCKING)
      initialize: async () => {
        logger.debug('[Auth] Initialize started (event-based)');

        // DEV-ONLY: if a mock (test login) session is active, skip Supabase
        // entirely so the real auth listener doesn't override/clear it.
        if (_get().isMockUser) {
          // Guard against a desynced dev session: the mock user lives in this
          // (persisted) store, but the devCloud "is logged in" flag lives in a
          // separate localStorage key. If that key was cleared independently
          // (e.g. by hand in DevTools) and there is no real Supabase to fall
          // back to, sync would silently break. Reconcile by clearing the
          // stale mock session instead of showing a logged-in user with no cloud.
          if (!isDevCloudActive() && !supabase) {
            logger.warn('[Auth] Mock session present but devCloud inactive - clearing stale mock session');
            set({
              user: null,
              isAuthenticated: false,
              isPro: false,
              isTeam: false,
              isMockUser: false,
              isInitialized: true,
              isLoading: false,
            });
            return;
          }
          logger.debug('[Auth] Mock dev session active - skipping Supabase init');
          set({ isInitialized: true, isLoading: false });
          return;
        }

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

              // Prefetch projects/folders so project-limit counts are correct
              // immediately after sign-in (before the drawer is ever opened).
              try {
                const { useBoardStore } = await import('./index');
                const boardState = useBoardStore.getState();
                await Promise.all([
                  boardState.fetchCloudProjects(),
                  boardState.fetchCloudFolders(),
                ]);
              } catch (error) {
                logger.error('[Auth] Failed to prefetch projects/folders:', error);
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
                      title: t('storeToast.saveGuestTitle'),
                      description: t('storeToast.saveGuestDescription'),
                      confirmLabel: t('storeToast.saveGuestConfirm'),
                      cancelLabel: t('storeToast.discard'),
                      danger: false,
                      onConfirm: async () => {
                        logger.debug('[Auth] User confirmed - saving guest work to cloud...');
                        const success = await boardState.saveToCloud();
                        
                        if (success) {
                          await boardState.fetchCloudProjects();
                          logger.debug('[Auth] ✓ Guest work saved to cloud');
                          
                          // Show success toast
                          useUIStore.getState().showToast(t('storeToast.guestWorkSaved'));
                        } else {
                          logger.error('[Auth] ✗ Failed to save guest work');
                          useUIStore.getState().showToast(t('storeToast.guestWorkSaveFailed'));
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
        // DEV-ONLY: mock sessions have no real Supabase session to clear.
        if (_get().isMockUser) {
          _get().devLogout();
          return;
        }

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

      // ===== DEV-ONLY TEST AUTH =====
      // Lets devs flip between guest/free/pro/team instantly without
      // going through Google OAuth. Safe to delete this block (and the
      // matching UI buttons) once real auth testing is no longer needed -
      // it does not touch Supabase and has no effect on real users.
      devLogin: (tier) => {
        if (tier === 'guest') {
          set({
            user: null,
            isAuthenticated: false,
            isPro: false,
            isTeam: false,
            isMockUser: true,
            error: null,
          });
          setDevCloudUser(null);
          logger.debug('[Auth][DEV] Logged in as guest (mock)');
          return;
        }

        const mockUser: User = {
          id: `dev-${tier}-user`,
          email: `dev-${tier}@tmcstudio.test`,
          full_name: `Test ${tier.charAt(0).toUpperCase()}${tier.slice(1)} User`,
          subscription_tier: tier,
        };

        set({
          user: mockUser,
          isAuthenticated: true,
          isPro: tier === 'pro' || tier === 'team',
          isTeam: tier === 'team',
          isMockUser: true,
          error: null,
        });
        setDevCloudUser(mockUser.id);
        logger.debug(`[Auth][DEV] Logged in as mock ${tier} user`);

        // Prefetch this mock user's devCloud projects/folders so limit counts
        // are correct right away (mirrors the real sign-in prefetch above).
        (async () => {
          try {
            const { useBoardStore } = await import('./index');
            const boardState = useBoardStore.getState();
            await Promise.all([
              boardState.fetchCloudProjects(),
              boardState.fetchCloudFolders(),
            ]);
          } catch (error) {
            logger.error('[Auth][DEV] Failed to prefetch after devLogin:', error);
          }
        })();
      },

      devLogout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isPro: false,
          isTeam: false,
          isMockUser: false,
          isLoading: false,
          error: null,
        });
        setDevCloudUser(null);
        logger.debug('[Auth][DEV] Mock session cleared');

        // Mirror the real signOut's local cleanup so board state doesn't
        // leak between test sessions.
        (async () => {
          try {
            const { useBoardStore } = await import('./index');
            const boardState = useBoardStore.getState();
            boardState.newDocument();
            localStorage.removeItem('tmc-studio-board');
            boardState.clearAutoSaveTimer();
          } catch (error) {
            logger.error('[Auth][DEV] Failed to clean up board state:', error);
          }
        })();
      },

      devClearData: () => {
        clearDevCloudData();
        logger.debug('[Auth][DEV] Cleared devCloud data for current mock user');

        (async () => {
          try {
            const { useBoardStore } = await import('./index');
            const boardState = useBoardStore.getState();
            boardState.newDocument();
            localStorage.removeItem('tmc-studio-board');
            await boardState.fetchCloudProjects();
            await boardState.fetchCloudFolders();
          } catch (error) {
            logger.error('[Auth][DEV] Failed to refresh after clearing dev data:', error);
          }
        })();
      },

      devClearAllTiers: () => {
        clearAllDevCloudData();
        logger.debug('[Auth][DEV] Cleared devCloud data for ALL test tiers');

        (async () => {
          try {
            const { useBoardStore } = await import('./index');
            const boardState = useBoardStore.getState();
            boardState.newDocument();
            localStorage.removeItem('tmc-studio-board');
            await boardState.fetchCloudProjects();
            await boardState.fetchCloudFolders();
          } catch (error) {
            logger.error('[Auth][DEV] Failed to refresh after clearing all dev data:', error);
          }
        })();
      },
    }),
    {
      name: 'tmc-auth',
      partialize: (state) => ({
        // Only persist non-sensitive data
        isInitialized: state.isInitialized,
        // DEV-ONLY: persist mock test sessions across reloads so the
        // "Test login" state survives a page refresh during testing.
        isMockUser: state.isMockUser,
        user: state.isMockUser ? state.user : undefined,
        isAuthenticated: state.isMockUser ? state.isAuthenticated : undefined,
        isPro: state.isMockUser ? state.isPro : undefined,
        isTeam: state.isMockUser ? state.isTeam : undefined,
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
