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
import { track, EVENTS } from '../lib/analytics';
import {
  isSupabaseEnabled,
  getCurrentUser,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  signInWithGoogle as supabaseSignInWithGoogle,
  onAuthStateChange,
  getPreferences,
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
  /** Club Premium team ID if user is a member of a team */
  teamId: string | null;
}

const AUTH_CALLBACK_PARAMS = ['code', 'state', 'error', 'error_code', 'error_description'];

function hasAuthCallbackInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return AUTH_CALLBACK_PARAMS.some((key) => params.has(key)) ||
    window.location.hash.includes('access_token') ||
    window.location.hash.includes('error');
}

function cleanAuthCallbackUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let changed = false;

  AUTH_CALLBACK_PARAMS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });

  if (url.hash.includes('access_token') || url.hash.includes('error')) {
    url.hash = '';
    changed = true;
  }

  if (changed) {
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', next || '/app');
  }
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
      teamId: null,

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
              teamId: null,
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
          const hasAuthCallback = hasAuthCallbackInUrl();
          
          if (hasAuthCallback) {
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
              teamId: user?.team_id ?? null,
            });

            // Load preferences from cloud if user is authenticated
            if (user) {
              logger.debug('[Auth] Loading preferences from cloud...');
              try {
                const cloudPrefs = await getPreferences();
                if (cloudPrefs) {
                  const { useUIStore } = await import('./useUIStore');
                  // Merge cloud preferences with local (cloud takes precedence)
                  if (cloudPrefs.theme) useUIStore.getState().setTheme(cloudPrefs.theme);
                  if (cloudPrefs.gridVisible !== undefined) useUIStore.setState({ gridVisible: cloudPrefs.gridVisible });
                  if (cloudPrefs.snapEnabled !== undefined) useUIStore.setState({ snapEnabled: cloudPrefs.snapEnabled });
                  if (cloudPrefs.bottomBar) {
                    useUIStore.setState({
                      bottomBarHeight: cloudPrefs.bottomBar.height,
                      bottomBarCollapsed: cloudPrefs.bottomBar.collapsed ?? false,
                    });
                  }
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

            }

            // Clean OAuth callback params/hash from URL after successful login
            if (hasAuthCallback && user) {
              logger.debug('[Auth] Cleaning OAuth callback from URL');
              cleanAuthCallbackUrl();
            }
          });
          
          logger.debug('[Auth] Listener active');

          // ✅ After OAuth callback, check session with a short delay as fallback.
          // The onAuthStateChange listener should fire automatically when Supabase
          // processes the token, but in some cases (slow network, race conditions)
          // the listener may fire after the UI has already rendered as logged-out.
          if (hasAuthCallback) {
            // Try to apply the session that Supabase establishes from the OAuth
            // code exchange. The onAuthStateChange listener should fire SIGNED_IN
            // automatically, but on slow/production networks the exchange can
            // finish after the UI has rendered as logged-out (and the listener
            // event can be missed). We poll a few times with backoff so the UI
            // updates on its own, instead of depending on a single 1.5s timeout
            // or a manual page refresh.
            const applyOAuthSession = async (): Promise<boolean> => {
              if (_get().isAuthenticated) return true;
              try {
                const { data: { session } } = await supabase!.auth.getSession();
                if (!session?.user) return false;

                const user = await getCurrentUser(session.user);
                if (!user) return false;

                set({
                  user,
                  isAuthenticated: true,
                  isPro: user.subscription_tier === 'pro' || user.subscription_tier === 'team',
                  isTeam: user.subscription_tier === 'team',
                  teamId: user.team_id ?? null,
                  isLoading: false,
                });
                logger.debug('[Auth] OAuth fallback: session applied for', user.email);

                // Load preferences
                try {
                  const cloudPrefs = await getPreferences();
                  if (cloudPrefs) {
                    const { useUIStore } = await import('./useUIStore');
                    if (cloudPrefs.theme) useUIStore.getState().setTheme(cloudPrefs.theme);
                    if (cloudPrefs.gridVisible !== undefined) useUIStore.setState({ gridVisible: cloudPrefs.gridVisible });
                    if (cloudPrefs.snapEnabled !== undefined) useUIStore.setState({ snapEnabled: cloudPrefs.snapEnabled });
                    if (cloudPrefs.bottomBar) {
                      useUIStore.setState({
                        bottomBarHeight: cloudPrefs.bottomBar.height,
                        bottomBarCollapsed: cloudPrefs.bottomBar.collapsed ?? false,
                      });
                    }
                    logger.debug('[Auth] Preferences loaded from cloud (fallback)');
                  }
                } catch (error) {
                  logger.error('[Auth] Failed to load preferences (fallback):', error);
                }
                return true;
              } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                  logger.debug('[Auth] AbortError in fallback (expected) - ignored');
                } else {
                  logger.error('[Auth] Fallback session check error:', error);
                }
                return false;
              }
            };

            // Backoff schedule (ms from now) covering slow production exchanges.
            const retryDelays = [400, 1000, 2000, 3500, 5000];
            retryDelays.forEach((delay) => {
              window.setTimeout(async () => {
                // Clean stale OAuth params from the URL on each pass.
                if (hasAuthCallbackInUrl()) {
                  cleanAuthCallbackUrl();
                }
                await applyOAuthSession();
              }, delay);
            });
          }

          // ✅ Check for existing session ONLY if NOT OAuth callback
          // (OAuth callback will be processed by Supabase and trigger onAuthStateChange)
          if (!hasAuthCallback) {
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
                    const cloudPrefs = await getPreferences();
                    if (cloudPrefs) {
                      const { useUIStore } = await import('./useUIStore');
                      if (cloudPrefs.theme) useUIStore.getState().setTheme(cloudPrefs.theme);
                      if (cloudPrefs.gridVisible !== undefined) useUIStore.setState({ gridVisible: cloudPrefs.gridVisible });
                      if (cloudPrefs.snapEnabled !== undefined) useUIStore.setState({ snapEnabled: cloudPrefs.snapEnabled });
                      if (cloudPrefs.bottomBar) {
                        useUIStore.setState({
                          bottomBarHeight: cloudPrefs.bottomBar.height,
                          bottomBarCollapsed: cloudPrefs.bottomBar.collapsed ?? false,
                        });
                      }
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
            error: 'auth.errorInitFailed',
          });
        }
      },

      // Sign in with email/password
      signIn: async (email: string, password: string) => {
        if (!isSupabaseEnabled()) {
          set({ error: 'auth.errorOfflineMode' });
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
          set({ error: 'auth.errorOfflineMode' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          await supabaseSignUp(email, password, fullName);
          set({
            isLoading: false,
            error: null,
          });
          track(EVENTS.SIGNUP, { method: 'email' });
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
          set({ error: 'auth.errorOfflineMode' });
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
            teamId: null,
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
            isTeam: false,            teamId: null,            isMockUser: true,
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
          teamId: tier === 'team' ? 'dev-team-id' : null,
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
          teamId: null,
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
