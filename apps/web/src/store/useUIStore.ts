/**
 * UI State Store - manages theme, focus mode, command palette, and UI visibility
 */

import { useEffect } from 'react';
import { logger } from '../lib/logger';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translate as t } from '@tmc/ui';
import type { ArrowType, ArrowDefaults, ZoneDefaults } from '@tmc/core';
import { DEFAULT_ARROW_DEFAULTS, DEFAULT_ZONE_DEFAULTS } from '@tmc/core';

/** Active tool types */
export type ActiveTool =
  | 'select'
  | 'player-home'
  | 'player-away'
  | 'ball'
  | 'arrow-pass'
  | 'arrow-run'
  | 'arrow-shoot'
  | 'arrow-dribble'
  | 'zone'
  | 'zone-ellipse'
  | 'zone-polygon'
  | 'text'
  | 'drawing'
  | 'highlighter'
  | null;

/** Theme type (resolved, applied to <html>) */
export type Theme = 'light' | 'dark';

/** Theme preference — 'system' follows the OS color scheme. */
export type ThemeMode = 'light' | 'dark' | 'system';

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
  onCancel?: () => void;
}

/** Layer visibility types */
export type LayerType = 'homePlayers' | 'awayPlayers' | 'ball' | 'arrows' | 'zones' | 'labels' | 'equipment' | 'drawings';

/** Layer visibility state */
export interface LayerVisibility {
  homePlayers: boolean;
  awayPlayers: boolean;
  ball: boolean;
  arrows: boolean;
  zones: boolean;
  labels: boolean;
  equipment: boolean;
  drawings: boolean;
}

/** Zoom constants */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.25;

/** SmartBottomBar resizable height constraints (px) */
export const DEFAULT_BOTTOM_BAR_HEIGHT = 56; // matches old fixed h-14
export const BOTTOM_BAR_MIN_HEIGHT = 48;
export const BOTTOM_BAR_MAX_HEIGHT = 240;
export const BOTTOM_BAR_COLLAPSED_HEIGHT = 8;

/** RightInspector resizable width constraints (px) */
export const DEFAULT_INSPECTOR_WIDTH = 340;
export const INSPECTOR_MIN_WIDTH = 220;
export const INSPECTOR_MAX_WIDTH = 480;

/** Viewport breakpoint type */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

/** Get breakpoint from viewport width */
export function getBreakpoint(width: number): Breakpoint {
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  return 'sm';
}

/** Save status for current project */
export type ProjectSaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

/** UI Store state */
interface UIState {
  // Theme
  theme: Theme;
  themeMode: ThemeMode;
  
  // Modes
  focusMode: boolean;
  isPrintMode: boolean; // Print-friendly mode (UI-only, not persisted)
  
  // Visibility toggles
  inspectorOpen: boolean;
  cheatSheetVisible: boolean;
  commandPaletteOpen: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  gridSize: number;
  defaultArrowType: ArrowType;
  /** User-level default style for new arrows (persisted). */
  arrowDefaults: ArrowDefaults;
  /** User-level default style for new zones (persisted). */
  zoneDefaults: ZoneDefaults;
  footerVisible: boolean;
  hasSeenShortcutsHint: boolean;

  // Bottom bar (SmartBottomBar) resizable height + collapsed state
  bottomBarHeight: number;
  bottomBarCollapsed: boolean;
  inspectorWidth: number;
  
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
  
  // Viewport lock (PR-UX-3 ETAP 4)
  viewportLocked: boolean;
  
  // Playback state
  isPlaying: boolean;
  isLooping: boolean;
  stepDuration: number;
  
  // Animation state (0 = at currentStep, 1 = at nextStep)
  animationProgress: number;
  
  // Online/offline state (PR-L5-MINI)
  isOnline: boolean;
  lastSaveFailureAt: number | null;
  
  // Save status (Sprint G)
  projectSaveStatus: ProjectSaveStatus;
  
  // Help sidebar (Sprint E)
  helpSidebarOpen: boolean;
  
  // Tutorial (Sprint F)
  tutorialCompleted: boolean;
  showTutorial: boolean;
  tutorialForceVisible: boolean;
  
  // Club Premium Welcome (Sprint H3)
  clubWelcomeSeen: boolean;
  
  // Actions - Theme
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: ThemeMode) => void;
  
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
  setGridSize: (size: number) => void;
  setDefaultArrowType: (type: ArrowType) => void;
  /** Patch arrow defaults (e.g. set per-type stroke or heads). */
  setArrowDefaults: (patch: Partial<ArrowDefaults>) => void;
  /** Patch zone defaults. */
  setZoneDefaults: (patch: Partial<ZoneDefaults>) => void;
  /** Reset element defaults to built-in values. */
  resetElementDefaults: () => void;
  toggleFooter: () => void;
  setFooterVisible: (visible: boolean) => void;

  // Actions - Bottom bar
  setBottomBarHeight: (height: number) => void;
  setInspectorWidth: (width: number) => void;
  toggleBottomBarCollapsed: () => void;
  setBottomBarCollapsed: (collapsed: boolean) => void;
  
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
  
  // Actions - Viewport Lock (PR-UX-3 ETAP 4)
  toggleViewportLock: () => void;
  setViewportLock: (locked: boolean) => void;
  
  // Actions - Playback
  play: () => void;
  pause: () => void;
  toggleLoop: () => void;
  setStepDuration: (duration: number) => void;
  setAnimationProgress: (progress: number) => void;
  
  // Actions - Online/offline (PR-L5-MINI)
  setOnline: (online: boolean) => void;
  showSaveFailureToast: () => void;
  
  // Actions - Save status (Sprint G)
  setProjectSaveStatus: (status: ProjectSaveStatus) => void;
  
  // Actions - Help sidebar (Sprint E)
  setHelpSidebarOpen: (open: boolean) => void;
  toggleHelpSidebar: () => void;
  
  // Actions - Tutorial (Sprint F)
  setTutorialCompleted: (completed: boolean) => void;
  setShowTutorial: (show: boolean) => void;
  /** Replay the 5-step tutorial — resets completed flag and forces show */
  replayTutorial: () => void;
  
  // Actions - Club Welcome (Sprint H3)
  setClubWelcomeSeen: (seen: boolean) => void;
  
  // Breakpoint
  breakpoint: Breakpoint;
  setBreakpoint: (bp: Breakpoint) => void;
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

/** Resolve a theme preference to an actual theme (handles 'system'). */
const resolveThemeMode = (mode: ThemeMode): Theme => {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return mode;
};

let systemThemeMql: MediaQueryList | null = null;
let systemThemeHandler: ((e: MediaQueryListEvent) => void) | null = null;
/** Attach the OS color-scheme listener only while mode === 'system'; detach otherwise. */
const updateSystemThemeListener = (mode: ThemeMode, onChange: (t: Theme) => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  if (systemThemeMql && systemThemeHandler) {
    systemThemeMql.removeEventListener('change', systemThemeHandler);
    systemThemeMql = null;
    systemThemeHandler = null;
  }
  if (mode === 'system') {
    systemThemeMql = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeHandler = (e) => onChange(e.matches ? 'dark' : 'light');
    systemThemeMql.addEventListener('change', systemThemeHandler);
  }
};

/** Sync preferences to cloud */
const syncPreferencesToCloud = async (prefs: {
  theme?: Theme;
  gridVisible?: boolean;
  snapEnabled?: boolean;
  cheatSheetVisible?: boolean;
  bottomBar?: { height: number; collapsed: boolean };
  inspector?: { width: number };
}) => {
  try {
    const { updatePreferences, isSupabaseEnabled } = await import('../lib/supabase');
    if (isSupabaseEnabled()) {
      await updatePreferences(prefs);
    }
  } catch (error) {
    logger.error('Failed to sync preferences to cloud:', error);
  }
};

/** Create the UI store with persistence for theme */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'dark',
      themeMode: 'dark',
      focusMode: false,
      isPrintMode: false, // Print mode is UI-only, not persisted
      inspectorOpen: getInitialInspectorState(),
      cheatSheetVisible: false, // Never auto-open (Hard Rule A)
      commandPaletteOpen: false,
      gridVisible: false,
      snapEnabled: true,
      gridSize: 10,
      defaultArrowType: 'pass',
      arrowDefaults: DEFAULT_ARROW_DEFAULTS,
      zoneDefaults: DEFAULT_ZONE_DEFAULTS,
      footerVisible: true,
      hasSeenShortcutsHint: false, // One-time hint tracking
      bottomBarHeight: DEFAULT_BOTTOM_BAR_HEIGHT,
      bottomBarCollapsed: false,
      inspectorWidth: DEFAULT_INSPECTOR_WIDTH,
      layerVisibility: {
        homePlayers: true,
        awayPlayers: true,
        ball: true,
        arrows: true,
        zones: true,
        labels: true,
        equipment: true,
        drawings: true,
      },
      activeTool: null,
      activeToast: null,
      confirmModal: null,
      zoom: 1,
      viewportLocked: false,
      isPlaying: false,
      isLooping: false,
      stepDuration: 0.8,
      animationProgress: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastSaveFailureAt: null,
      projectSaveStatus: 'saved',
      helpSidebarOpen: false,
      tutorialCompleted: false,
      showTutorial: false,
      tutorialForceVisible: false,
      clubWelcomeSeen: false,
      breakpoint: typeof window !== 'undefined' ? getBreakpoint(window.innerWidth) : 'xl',

      // Theme actions
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        applyThemeToDocument(newTheme);
        updateSystemThemeListener(newTheme, () => {});
        set({ theme: newTheme, themeMode: newTheme });
        // Sync to cloud
        syncPreferencesToCloud({ theme: newTheme });
      },
      
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        updateSystemThemeListener(theme, () => {});
        set({ theme, themeMode: theme });
        // Sync to cloud
        syncPreferencesToCloud({ theme });
      },

      setThemeMode: (mode) => {
        const resolved = resolveThemeMode(mode);
        applyThemeToDocument(resolved);
        updateSystemThemeListener(mode, (t) => {
          applyThemeToDocument(t);
          set({ theme: t });
        });
        set({ themeMode: mode, theme: resolved });
        // Sync to cloud
        syncPreferencesToCloud({ theme: resolved });
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
      setGridSize: (size) => {
        const next = Math.max(5, Math.min(40, Math.round(size)));
        set({ gridSize: next });
      },
      setDefaultArrowType: (type) => set({ defaultArrowType: type }),
      setArrowDefaults: (patch) =>
        set((state) => ({
          arrowDefaults: {
            ...state.arrowDefaults,
            ...patch,
            strokeWidth: { ...state.arrowDefaults.strokeWidth, ...(patch.strokeWidth ?? {}) },
          },
        })),
      setZoneDefaults: (patch) =>
        set((state) => ({ zoneDefaults: { ...state.zoneDefaults, ...patch } })),
      resetElementDefaults: () =>
        set({ arrowDefaults: DEFAULT_ARROW_DEFAULTS, zoneDefaults: DEFAULT_ZONE_DEFAULTS }),
      
      toggleFooter: () => set((s) => ({ footerVisible: !s.footerVisible })),
      setFooterVisible: (visible) => set({ footerVisible: visible }),

      // Bottom bar actions (drag-resizable SmartBottomBar)
      setBottomBarHeight: (height) => {
        const clamped = Math.max(
          BOTTOM_BAR_MIN_HEIGHT,
          Math.min(BOTTOM_BAR_MAX_HEIGHT, Math.round(height))
        );
        set({ bottomBarHeight: clamped });
        syncPreferencesToCloud({ bottomBar: { height: clamped, collapsed: get().bottomBarCollapsed } });
      },
      setInspectorWidth: (width) => {
        const clamped = Math.max(
          INSPECTOR_MIN_WIDTH,
          Math.min(INSPECTOR_MAX_WIDTH, Math.round(width))
        );
        set({ inspectorWidth: clamped });
        syncPreferencesToCloud({ inspector: { width: clamped } });
      },
      toggleBottomBarCollapsed: () => {
        const collapsed = !get().bottomBarCollapsed;
        set({ bottomBarCollapsed: collapsed });
        syncPreferencesToCloud({ bottomBar: { height: get().bottomBarHeight, collapsed } });
      },
      setBottomBarCollapsed: (collapsed) => {
        set({ bottomBarCollapsed: collapsed });
        syncPreferencesToCloud({ bottomBar: { height: get().bottomBarHeight, collapsed } });
      },

      // Tool actions
      setActiveTool: (tool) => {
        set({ activeTool: tool });
        
        // Show toast hint when tool is activated
        if (tool && tool !== 'select') {
          const toolNames: Record<string, string> = {
            'player-home': t('storeToast.tools.player-home'),
            'player-away': t('storeToast.tools.player-away'),
            'ball': t('storeToast.tools.ball'),
            'arrow-pass': t('storeToast.tools.arrow-pass'),
            'arrow-run': t('storeToast.tools.arrow-run'),
            'arrow-shoot': t('storeToast.tools.arrow-shoot'),
            'arrow-dribble': t('storeToast.tools.arrow-dribble'),
            'zone': t('storeToast.tools.zone'),
            'zone-ellipse': t('storeToast.tools.zone-ellipse'),
            'zone-polygon': t('storeToast.tools.zone-polygon'),
            'text': t('storeToast.tools.text'),
          };
          const toolName = toolNames[tool] || tool;
          get().showToast(t('storeToast.toolActive', { tool: toolName }));
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
        get().showToast(t('storeToast.zoom', { percent: Math.round(newZoom * 100) }), 800);
      },
      
      zoomOut: () => {
        const newZoom = Math.max(ZOOM_MIN, get().zoom - ZOOM_STEP);
        set({ zoom: newZoom });
        get().showToast(t('storeToast.zoom', { percent: Math.round(newZoom * 100) }), 800);
      },
      
      zoomFit: () => {
        set({ zoom: 1 });
        get().showToast(t('storeToast.zoomFit'), 800);
      },
      
      setZoom: (zoom) => {
        const clampedZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
        set({ zoom: clampedZoom });
      },
      
      // Viewport Lock actions (PR-UX-3 ETAP 4)
      toggleViewportLock: () => set((s) => ({ viewportLocked: !s.viewportLocked })),
      setViewportLock: (locked) => set({ viewportLocked: locked }),
      
      // Playback actions
      play: () => set({ isPlaying: true, animationProgress: 0 }),
      pause: () => set({ isPlaying: false }),
      toggleLoop: () => set((s) => ({ isLooping: !s.isLooping })),
      setStepDuration: (duration) => set({ stepDuration: Math.max(0.1, Math.min(5, duration)) }),
      setAnimationProgress: (progress) => set({ animationProgress: Math.max(0, Math.min(1, progress)) }),
      
      // Online/offline actions (PR-L5-MINI)
      setOnline: (online) => {
        set({ isOnline: online });
        if (online) {
          get().showToast(t('storeToast.backOnline'), 1500);
        } else {
          get().showToast(t('storeToast.offline'), 1500);
        }
      },
      
      setBreakpoint: (bp) => set({ breakpoint: bp }),
      
      showSaveFailureToast: () => {
        const now = Date.now();
        const lastFailure = get().lastSaveFailureAt;
        
        // Rate limit: only show toast if last failure was >5 seconds ago
        if (!lastFailure || now - lastFailure > 5000) {
          get().showToast(t('storeToast.saveFailedRetry'), 3000);
          set({ lastSaveFailureAt: now });
        }
      },
      
      // Save status actions (Sprint G)
      setProjectSaveStatus: (status) => set({ projectSaveStatus: status }),
      
      // Help sidebar actions (Sprint E)
      setHelpSidebarOpen: (open) => set({ helpSidebarOpen: open }),
      toggleHelpSidebar: () => set((s) => ({ helpSidebarOpen: !s.helpSidebarOpen })),
      
      // Tutorial actions (Sprint F)
      setTutorialCompleted: (completed) => set({ tutorialCompleted: completed }),
      setShowTutorial: (show) => set({ showTutorial: show, tutorialForceVisible: show ? get().tutorialForceVisible : false }),
      replayTutorial: () => set({ tutorialCompleted: false, showTutorial: true, tutorialForceVisible: true }),
      setClubWelcomeSeen: (seen) => set({ clubWelcomeSeen: seen }),
    }),
    {
      name: 'tmc-ui-settings',
      partialize: (state) => ({
        // Only persist these settings
        theme: state.theme,
        themeMode: state.themeMode,
        // cheatSheetVisible: NOT persisted (Hard Rule A)
        hasSeenShortcutsHint: state.hasSeenShortcutsHint,
        gridVisible: state.gridVisible,
        snapEnabled: state.snapEnabled,
        gridSize: state.gridSize,
        defaultArrowType: state.defaultArrowType,
        arrowDefaults: state.arrowDefaults,
        zoneDefaults: state.zoneDefaults,
        stepDuration: state.stepDuration,
        footerVisible: state.footerVisible,
        inspectorOpen: state.inspectorOpen,
        viewportLocked: state.viewportLocked, // PR-UX-3 ETAP 4
        tutorialCompleted: state.tutorialCompleted, // Sprint F
        clubWelcomeSeen: state.clubWelcomeSeen, // Sprint H3
        bottomBarHeight: state.bottomBarHeight,
        bottomBarCollapsed: state.bottomBarCollapsed,
        inspectorWidth: state.inspectorWidth,
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

  // On mount: if the persisted preference is 'system', resolve against the OS
  // and attach a listener so the app follows live OS theme changes.
  useEffect(() => {
    const mode = useUIStore.getState().themeMode;
    if (mode === 'system') {
      const resolved = resolveThemeMode('system');
      applyThemeToDocument(resolved);
      updateSystemThemeListener('system', (t) => {
        applyThemeToDocument(t);
        useUIStore.setState({ theme: t });
      });
      useUIStore.setState({ theme: resolved });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme on mount
  if (typeof document !== 'undefined') {
    applyThemeToDocument(theme);
  }
};
