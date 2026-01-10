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

      // Initialize auth - call on app startup
      initialize: async () => {
        console.log('[Auth] Initialize started');
        
        if (!isSupabaseEnabled() || !supabase) {
          console.log('[Auth] Supabase disabled - using offline mode');
          set({ isInitialized: true, isLoading: false });
          return;
        }

        set({ isLoading: true });

        try {
          // First, get the session - this will process any OAuth callback automatically
          console.log('[Auth] Getting session...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('[Auth] Session error:', sessionError);
            throw sessionError;
          }
          
          console.log('[Auth] Session:', session ? 'Found' : 'None');
          
          // If we have a session, get the full user profile
          let user: User | null = null;
          if (session?.user) {
            console.log('[Auth] User in session:', session.user.email);
            user = await getCurrentUser();
            console.log('[Auth] Full user profile:', user);
          }
          
          // Clear hash from URL if present (cleanup after OAuth)
          if (window.location.hash && window.location.hash.includes('access_token')) {
            console.log('[Auth] Clearing OAuth hash from URL');
            window.history.replaceState(null, '', window.location.pathname);
          }

          set({
            user,
            isAuthenticated: !!user,
            isPro: user?.subscription_tier === 'pro' || user?.subscription_tier === 'team',
            isTeam: user?.subscription_tier === 'team',
            isLoading: false,
            isInitialized: true,
          });
          
          console.log('[Auth] Initialized - authenticated:', !!user);
          
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

          // Listen for auth changes (login, logout, token refresh)
          onAuthStateChange((user) => {
            console.log('[Auth] State changed - user:', user?.email ?? 'none');
            set({
              user,
              isAuthenticated: !!user,
              isPro: user?.subscription_tier === 'pro' || user?.subscription_tier === 'team',
              isTeam: user?.subscription_tier === 'team',
            });
          });
          
        } catch (error) {
          // Ignore AbortError - it's expected during page navigation
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('[Auth] AbortError (expected during navigation)');
            set({ isLoading: false, isInitialized: true });
            return;
          }
          
          console.error('[Auth] Initialization error:', error);
          set({
            isLoading: false,
            isInitialized: true,
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
