/**
 * useViewportSync - Syncs window resize events to useUIStore breakpoint
 * Call once at app root (BoardPage.tsx)
 */

import { useEffect } from 'react';
import { useUIStore, getBreakpoint } from '../store/useUIStore';

export function useViewportSync() {
  const setBreakpoint = useUIStore((s) => s.setBreakpoint);

  useEffect(() => {
    const handleResize = () => {
      const bp = getBreakpoint(window.innerWidth);
      setBreakpoint(bp);
    };

    // Set initial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setBreakpoint]);
}