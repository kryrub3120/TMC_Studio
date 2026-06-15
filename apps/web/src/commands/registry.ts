/**
 * Command Registry - Main Entry Point
 * 
 * Creates the complete command registry that UI components will use
 * instead of directly calling store actions.
 * 
 * ⚠️ PR0 ONLY: Commands pass through to store for now
 * This is scaffolding only - UI will be wired in PR1+
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-0
 */

import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import type { CommandRegistry } from './types';
import { createBoardCommands } from './board';

/**
 * Create the command registry
 * 
 * This is the main factory function that creates all commands.
 * In PR0, commands pass through to store (scaffolding only).
 * In PR1+, UI will use these commands exclusively.
 * 
 * @returns CommandRegistry - Complete command registry
 */
export function createCommandRegistry(): CommandRegistry {
  return {
    board: createBoardCommands(),
    
    animation: {
      play: () => useUIStore.getState().play(),
      pause: () => useUIStore.getState().pause(),
      stop: () => {
        const ui = useUIStore.getState();
        ui.pause();
        ui.setAnimationProgress(0);
      },
    },
    
    edit: {
      cut: () => {
        const store = useBoardStore.getState();
        store.copySelection();
        store.deleteSelected();
      },
      copy: () => useBoardStore.getState().copySelection(),
      paste: () => useBoardStore.getState().pasteClipboard(),
    },

    // View commands (PR-UX-3 ETAP 4)
    view: {
      toggleViewportLock: () => useUIStore.getState().toggleViewportLock(),
      setViewportLock: (locked) => useUIStore.getState().setViewportLock(locked),
    },
  };
}

/**
 * Singleton instance (optional - can also be created via useMemo in App)
 * 
 * Not used in PR0, but provided for future use
 */
let _registry: CommandRegistry | null = null;

export function getCommandRegistry(): CommandRegistry {
  if (!_registry) {
    _registry = createCommandRegistry();
  }
  return _registry;
}

/**
 * Reset registry (useful for testing)
 */
export function resetCommandRegistry(): void {
  _registry = null;
}
