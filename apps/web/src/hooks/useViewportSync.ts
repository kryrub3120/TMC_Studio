/**
 * useViewportSync - Syncs window resize events to useUIStore breakpoint
 * Call once at app root (BoardPage.tsx)
 */

import { useEffect, useRef } from 'react';
import { useUIStore, getBreakpoint } from '../store/useUIStore';

export function useViewportSync() {
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);
  const previousBreakpoint = useRef<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const bp = getBreakpoint(window.innerWidth);
      setBreakpoint(bp);
      if (previousBreakpoint.current !== bp && (bp === 'sm' || bp === 'md')) {
        useUIStore.getState().setInspectorOpen(false);
      }
      previousBreakpoint.current = bp;
    };

    // Set initial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setBreakpoint]);
}
