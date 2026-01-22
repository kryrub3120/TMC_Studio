/**
 * Auth Store - Zustand
 * TMC Studio - Authentication state management
 * 
 * SIMPLIFIED VERSION - let Supabase handle OAuth automatically
 */

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
        console.log('[Auth] Initialize started (event-based)');
        
        if (!isSupabaseEnabled() || !supabase) {
          console.log('[Auth] Supabase disabled - using offline mode');
          set({ isInitialized: true, isLoading: false });
          return;
        }

        // ✅ UI starts IMMEDIATELY - no blocking
        set({ isInitialized: true, isLoading: false });

        try {
          // Check if OAuth callback (has hash with access_token)
          const hasOAuthHash = window.location.hash && window.location.hash.includes('access_token');
          
          if (hasOAuthHash) {
            console.log('[Auth] OAuth callback detected - will clean URL after processing');
          }

          // ✅ Setup listener for future auth changes
          console.log('[Auth] Setting up auth listener...');
          onAuthStateChange(async (user) => {
            console.log('[Auth] State changed - user:', user?.email ?? 'none');
            
            set({
              user,
              isAuthenticated: !!user,
              isPro: user?.subscription_tier === 'pro' || user?.subscription_tier === 'team',
              isTeam: user?.subscription_tier === 'team',
            });

            // Load preferences from cloud if user is authenticated
            if (user) {
              console.log('[Auth] Loading preferences from cloud...');
              try {
                const { getPreferences } = await import('../lib/supabase');
                const cloudPrefs = await getPreferences();
                if (cloudPrefs) {
                  const { useUIStore } = await import('./useUIStore');
                  // Merge cloud preferences with local (cloud takes precedence)
                  if (cloudPrefs.theme) useUIStore.getState().setTheme(cloudPrefs.theme);
                  if (cloudPrefs.gridVisible !== undefined) useUIStore.setState({ gridVisible: cloudPrefs.gridVisible });
                  if (cloudPrefs.snapEnabled !== undefined) useUIStore.setState({ snapEnabled: cloudPrefs.snapEnabled });
                  console.log('[Auth] Preferences loaded from cloud');
                }
              } catch (error) {
                console.error('[Auth] Failed to load preferences:', error);
              }
            }

            // Clean OAuth hash from URL after successful login
            if (hasOAuthHash && user) {
              console.log('[Auth] Cleaning OAuth hash from URL');
              window.history.replaceState(null, '', window.location.pathname);
            }
          });
          
          console.log('[Auth] Listener active');

          // ✅ Check for existing session ONLY if NOT OAuth callback
          // (OAuth hash will be processed by Supabase and trigger onAuthStateChange)
          if (!hasOAuthHash) {
            console.log('[Auth] Checking for existing session...');
            try {
              const { data: { session } } = await supabase.auth.getSession();
              
              if (session?.user) {
                console.log('[Auth] Existing session found:', session.user.email);
                const user = await getCurrentUser();
                if (user) {
                  console.log('[Auth] User profile loaded:', user.email);
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
                      console.log('[Auth] Preferences loaded from cloud');
                    }
                  } catch (error) {
                    console.error('[Auth] Failed to load preferences:', error);
                  }
                }
              } else {
                console.log('[Auth] No existing session');
              }
            } catch (error) {
              // Ignore AbortError - it's expected during OAuth processing
              if (error instanceof Error && error.name === 'AbortError') {
                console.log('[Auth] AbortError (expected during OAuth) - ignored');
              } else {
                console.error('[Auth] Session check error:', error);
              }
            }
          } else {
            console.log('[Auth] Skipping session check - OAuth callback will be handled by listener');
          }
          
        } catch (error) {
          console.error('[Auth] Initialization error:', error);
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
          console.log('[Auth] Starting Google sign in...');
          await supabaseSignInWithGoogle();
          // Redirect will happen, state will be set after return
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Google sign in failed';
          console.error('[Auth] Google sign in error:', error);
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
          console.log('[Auth] Successfully signed out');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign out failed';
          console.error('[Auth] Sign out error:', error);
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
    console.log('[Auth] Auto-init triggered');
    const { initialize } = useAuthStore.getState();
    initialize();
  }, 100);
}
