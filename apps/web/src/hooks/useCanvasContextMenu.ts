/**
 * Hook for managing canvas context menu state
 * PR-UX-5: Canvas Context Menu
 */

import { useState, useCallback } from 'react';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  elementId: string | null;
}

export function useCanvasContextMenu() {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });

  const showMenu = useCallback((x: number, y: number, elementId: string | null) => {
    setMenuState({ visible: true, x, y, elementId });
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, visible: false }));
  }, []);

  return { menuState, showMenu, hideMenu };
}
