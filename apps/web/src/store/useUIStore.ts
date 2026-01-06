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
  
  // Visibility toggles
  inspectorOpen: boolean;
  cheatSheetVisible: boolean;
  commandPaletteOpen: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  
  // Layer visibility (for Layers tab)
  layerVisibility: LayerVisibility;
  
  // Active tool (null = select mode)
  activeTool: ActiveTool;
  
  // Toast notifications
  activeToast: ToastMessage | null;
  
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
  
  // Actions - Visibility
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleCheatSheet: () => void;
  setCheatSheetVisible: (visible: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  
  // Actions - Tools
  setActiveTool: (tool: ActiveTool) => void;
  clearActiveTool: () => void;
  
  // Actions - Layers
  toggleLayerVisibility: (layer: LayerType) => void;
  setLayerVisibility: (layer: LayerType, visible: boolean) => void;
  
  // Actions - Toast
  showToast: (message: string, duration?: number) => void;
  clearToast: () => void;
  
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

/** Create the UI store with persistence for theme */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      focusMode: false,
      inspectorOpen: true,
      cheatSheetVisible: true, // Show by default for new users
      commandPaletteOpen: false,
      gridVisible: false,
      snapEnabled: true,
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
      },
      
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
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

      // Visibility actions
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      setInspectorOpen: (open) => set({ inspectorOpen: open }),
      
      toggleCheatSheet: () => set((s) => ({ cheatSheetVisible: !s.cheatSheetVisible })),
      setCheatSheetVisible: (visible) => set({ cheatSheetVisible: visible }),
      
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      
      toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
      toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

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
        cheatSheetVisible: state.cheatSheetVisible,
        gridVisible: state.gridVisible,
        snapEnabled: state.snapEnabled,
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
