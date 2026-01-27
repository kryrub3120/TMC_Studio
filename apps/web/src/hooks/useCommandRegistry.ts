/**
 * useCommandRegistry Hook
 * 
 * Provides stable access to the command registry for UI components.
 * Commands MUST be used instead of direct store action calls.
 * 
 * @see docs/REFACTOR_ROADMAP.md - PR-REFACTOR-1
 */

import { useMemo } from 'react';
import { createCommandRegistry } from '../commands';
import type { CommandRegistry } from '../commands';

/**
 * Hook that provides the command registry
 * 
 * Returns a STABLE reference (created once via useMemo)
 * UI components should use this instead of calling store actions directly
 * 
 * @example
 * ```tsx
 * const cmd = useCommandRegistry();
 * 
 * // ✅ GOOD - Using commands
 * onClick={() => cmd.board.selection.select(id, false)}
 * 
 * // ❌ BAD - Direct store access (violates project rules)
 * const selectElement = useBoardStore(s => s.selectElement);
 * onClick={() => selectElement(id, false)}
 * ```
 */
export function useCommandRegistry(): CommandRegistry {
  // Create registry once - stable reference
  // Commands internally access store, but UI doesn't call store directly
  const cmd = useMemo(() => createCommandRegistry(), []);
  
  return cmd;
}
