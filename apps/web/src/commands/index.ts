/**
 * Commands Index - Export command registry
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-0
 */

// New registry structure (PR0)
export { createCommandRegistry, getCommandRegistry, resetCommandRegistry } from './registry';
export type { 
  CommandRegistry,
  BoardCommands,
  CanvasCommands,
  SelectionCommands,
  HistoryCommands,
  AnimationCommands,
  EditCommands,
} from './types';

// Legacy exports (keep for now - will be removed in PR1+)
export { cmd, intentCommands, effectCommands } from './CommandRegistry';
