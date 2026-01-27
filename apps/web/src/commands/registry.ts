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
    
    // Animation commands - placeholder for now (TODO: PR1+)
    animation: {
      play: () => console.warn('animation.play not yet implemented'),
      pause: () => console.warn('animation.pause not yet implemented'),
      stop: () => console.warn('animation.stop not yet implemented'),
    },
    
    // Edit commands - placeholder for now (TODO: PR1+)
    edit: {
      cut: () => console.warn('edit.cut not yet implemented'),
      copy: () => console.warn('edit.copy not yet implemented'),
      paste: () => console.warn('edit.paste not yet implemented'),
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
