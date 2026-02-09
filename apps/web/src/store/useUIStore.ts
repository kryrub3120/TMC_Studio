/**
 * UI State Store - manages theme, focus mode, command palette, and UI visibility
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Active tool types */
export type ActiveTool =
  | 'select'
  | 'player-home'
  | 'player-away'
  | 'ball'
  | 'arrow-pass'
  | 'arrow-run'
  | 'arrow-shoot'
  | 'zone'
  | 'zone-ellipse'
  | 'text'
  | 'drawing'
  | 'highlighter'
  | null;

/** Theme type */
export type Theme = 'light' | 'dark';

/** Toast message with optional duration */
export interface ToastMessage {
  id: string;
  message: string;
  duration?: number;
}

/** Confirm modal configuration */
export interface ConfirmModalConfig {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

/** Layer visibility types */
export type LayerType = 'homePlayers' | 'awayPlayers' | 'ball' | 'arrows' | 'zones' | 'labels';

/** Layer visibility state */
export interface LayerVisibility {
  homePlayers: boolean;
  awayPlayers: boolean;
  ball: boolean;
  arrows: boolean;
  zones: boolean;
  labels: boolean;
}

/** Zoom constants */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.25;

/** UI Store state */
interface UIState {
  // Theme
  theme: Theme;
  
  // Modes
  focusMode: boolean;
  isPrintMode: boolean; // Print-friendly mode (UI-only, not persisted)
  
  // Visibility toggles
  inspectorOpen: boolean;
  cheatSheetVisible: boolean;
  commandPaletteOpen: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  footerVisible: boolean;
  hasSeenShortcutsHint: boolean;
  
  // Layer visibility (for Layers tab)
  layerVisibility: LayerVisibility;
  
  // Active tool (null = select mode)
  activeTool: ActiveTool;
  
  // Toast notifications
  activeToast: ToastMessage | null;
  
  // Confirm modal
  confirmModal: ConfirmModalConfig | null;
  
  // Zoom
  zoom: number;
  
  // Playback state
  isPlaying: boolean;
  isLooping: boolean;
  stepDuration: number;
  
  // Animation state (0 = at currentStep, 1 = at nextStep)
  animationProgress: number;
  
  // Actions - Theme
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  
  // Actions - Focus Mode
  toggleFocusMode: () => void;
  setFocusMode: (enabled: boolean) => void;
  
  // Actions - Print Mode
  togglePrintMode: () => void;
  
  // Actions - Visibility
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleCheatSheet: () => void;
  setCheatSheetVisible: (visible: boolean) => void;
  setHasSeenShortcutsHint: (seen: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleFooter: () => void;
  setFooterVisible: (visible: boolean) => void;
  
  // Actions - Tools
  setActiveTool: (tool: ActiveTool) => void;
  clearActiveTool: () => void;
  
  // Actions - Layers
  toggleLayerVisibility: (layer: LayerType) => void;
  setLayerVisibility: (layer: LayerType, visible: boolean) => void;
  
  // Actions - Toast
  showToast: (message: string, duration?: number) => void;
  clearToast: () => void;
  
  // Actions - Confirm Modal
  showConfirmModal: (config: ConfirmModalConfig) => void;
  closeConfirmModal: () => void;
  
  // Actions - Zoom
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  setZoom: (zoom: number) => void;
  
  // Actions - Playback
  play: () => void;
  pause: () => void;
  toggleLoop: () => void;
  setStepDuration: (duration: number) => void;
  setAnimationProgress: (progress: number) => void;
}

/** Get initial inspector state based on screen size */
const getInitialInspectorState = () => {
  if (typeof window === 'undefined') return true; // SSR safe
  return window.innerWidth >= 1280; // lg breakpoint
};

/** Generate unique ID for toasts */
let toastIdCounter = 0;
const generateToastId = () => `toast-${++toastIdCounter}`;

/** Apply theme to document */
const applyThemeToDocument = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

/** Sync preferences to cloud */
const syncPreferencesToCloud = async (prefs: { theme?: Theme; gridVisible?: boolean; snapEnabled?: boolean; cheatSheetVisible?: boolean }) => {
  try {
    const { updatePreferences, isSupabaseEnabled } = await import('../lib/supabase');
    if (isSupabaseEnabled()) {
      await updatePreferences(prefs);
    }
  } catch (error) {
    console.error('Failed to sync preferences to cloud:', error);
  }
};

/** Create the UI store with persistence for theme */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'dark',
      focusMode: false,
      isPrintMode: false, // Print mode is UI-only, not persisted
      inspectorOpen: getInitialInspectorState(),
      cheatSheetVisible: false, // Never auto-open (Hard Rule A)
      commandPaletteOpen: false,
      gridVisible: false,
      snapEnabled: true,
      footerVisible: true,
      hasSeenShortcutsHint: false, // One-time hint tracking
      layerVisibility: {
        homePlayers: true,
        awayPlayers: true,
        ball: true,
        arrows: true,
        zones: true,
        labels: true,
      },
      activeTool: null,
      activeToast: null,
      confirmModal: null,
      zoom: 1,
      isPlaying: false,
      isLooping: false,
      stepDuration: 0.8,
      animationProgress: 0,

      // Theme actions
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        applyThemeToDocument(newTheme);
        set({ theme: newTheme });
        // Sync to cloud
        syncPreferencesToCloud({ theme: newTheme });
      },
      
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
        // Sync to cloud
        syncPreferencesToCloud({ theme });
      },

      // Focus mode actions
      toggleFocusMode: () => {
        const newFocusMode = !get().focusMode;
        // When entering focus mode, hide cheat sheet
        if (newFocusMode) {
          set({ focusMode: true, cheatSheetVisible: false });
        } else {
          set({ focusMode: false });
        }
      },
      
      setFocusMode: (enabled) => {
        if (enabled) {
          set({ focusMode: true, cheatSheetVisible: false });
        } else {
          set({ focusMode: false });
        }
      },
      
      // Print mode actions (UI-only, does NOT mutate document)
      togglePrintMode: () => {
        set((s) => ({ isPrintMode: !s.isPrintMode }));
      },

      // Visibility actions
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      setInspectorOpen: (open) => set({ inspectorOpen: open }),
      
      toggleCheatSheet: () => set((s) => ({ cheatSheetVisible: !s.cheatSheetVisible })),
      setCheatSheetVisible: (visible) => set({ cheatSheetVisible: visible }),
      setHasSeenShortcutsHint: (seen) => set({ hasSeenShortcutsHint: seen }),
      
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      
      toggleGrid: () => {
        const newValue = !get().gridVisible;
        set({ gridVisible: newValue });
        // Sync to cloud
        syncPreferencesToCloud({ gridVisible: newValue });
      },
      toggleSnap: () => {
        const newValue = !get().snapEnabled;
        set({ snapEnabled: newValue });
        // Sync to cloud
        syncPreferencesToCloud({ snapEnabled: newValue });
      },
      
      toggleFooter: () => set((s) => ({ footerVisible: !s.footerVisible })),
      setFooterVisible: (visible) => set({ footerVisible: visible }),

      // Tool actions
      setActiveTool: (tool) => {
        set({ activeTool: tool });
        
        // Show toast hint when tool is activated
        if (tool && tool !== 'select') {
          const toolNames: Record<string, string> = {
            'player-home': 'Home Player',
            'player-away': 'Away Player',
            'ball': 'Ball',
            'arrow-pass': 'Pass Arrow',
            'arrow-run': 'Run Arrow',
            'arrow-shoot': 'Shoot Arrow',
            'zone': 'Zone',
            'text': 'Text',
          };
          const toolName = toolNames[tool] || tool;
          get().showToast(`${toolName} tool active — click to place • Esc to exit`);
        }
      },
      
      clearActiveTool: () => set({ activeTool: null }),

      // Layer visibility actions
      toggleLayerVisibility: (layer) => {
        set((s) => ({
          layerVisibility: {
            ...s.layerVisibility,
            [layer]: !s.layerVisibility[layer],
          },
        }));
      },
      
      setLayerVisibility: (layer, visible) => {
        set((s) => ({
          layerVisibility: {
            ...s.layerVisibility,
            [layer]: visible,
          },
        }));
      },

      // Toast actions
      showToast: (message, duration = 1200) => {
        const toast: ToastMessage = {
          id: generateToastId(),
          message,
          duration,
        };
        set({ activeToast: toast });
        
        // Auto-clear after duration
        setTimeout(() => {
          const current = get().activeToast;
          if (current?.id === toast.id) {
            set({ activeToast: null });
          }
        }, duration);
      },
      
      clearToast: () => set({ activeToast: null }),
      
      // Confirm modal actions
      showConfirmModal: (config) => set({ confirmModal: config }),
      closeConfirmModal: () => set({ confirmModal: null }),
      
      // Zoom actions
      zoomIn: () => {
        const newZoom = Math.min(ZOOM_MAX, get().zoom + ZOOM_STEP);
        set({ zoom: newZoom });
        get().showToast(`Zoom: ${Math.round(newZoom * 100)}%`, 800);
      },
      
      zoomOut: () => {
        const newZoom = Math.max(ZOOM_MIN, get().zoom - ZOOM_STEP);
        set({ zoom: newZoom });
        get().showToast(`Zoom: ${Math.round(newZoom * 100)}%`, 800);
      },
      
      zoomFit: () => {
        set({ zoom: 1 });
        get().showToast('Zoom: Fit (100%)', 800);
      },
      
      setZoom: (zoom) => {
        const clampedZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
        set({ zoom: clampedZoom });
      },
      
      // Playback actions
      play: () => set({ isPlaying: true, animationProgress: 0 }),
      pause: () => set({ isPlaying: false }),
      toggleLoop: () => set((s) => ({ isLooping: !s.isLooping })),
      setStepDuration: (duration) => set({ stepDuration: Math.max(0.1, Math.min(5, duration)) }),
      setAnimationProgress: (progress) => set({ animationProgress: Math.max(0, Math.min(1, progress)) }),
    }),
    {
      name: 'tmc-ui-settings',
      partialize: (state) => ({
        // Only persist these settings
        theme: state.theme,
        // cheatSheetVisible: NOT persisted (Hard Rule A)
        hasSeenShortcutsHint: state.hasSeenShortcutsHint,
        gridVisible: state.gridVisible,
        snapEnabled: state.snapEnabled,
        footerVisible: state.footerVisible,
        inspectorOpen: state.inspectorOpen,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    }
  )
);

/** Hook to initialize theme on app start */
export const useInitializeTheme = () => {
  const theme = useUIStore((s) => s.theme);
  
  // Apply theme on mount
  if (typeof document !== 'undefined') {
    applyThemeToDocument(theme);
  }
};
