/**
 * useTouchGestures - Touch gesture handler for canvas interactions
 * 
 * Provides pinch-to-zoom (delta-based), two-finger pan,
 * single tap → select, and double tap → zoom-to-fit.
 * 
 * Delta-based pinch: tracks cumulative delta from pinch start
 * rather than ratio between successive frames, giving smoother
 * and more predictable zoom behavior.
 */

import { useEffect, useRef } from 'react';
import { useUIStore, ZOOM_MIN, ZOOM_MAX } from '../store/useUIStore';
import { clampPanOffset } from '../utils/viewportUtils';

export interface TouchGesturesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Base canvas dimensions */
  canvasWidth: number;
  canvasHeight: number;
  /** Container dimensions (from ResizeObserver) */
  containerSize: { width: number; height: number };
  /** Current fitZoom factor */
  fitZoom: number;
  /** Current pan offset */
  panOffset: { x: number; y: number };
  /** Pan offset setter */
  setPanOffset: (offset: { x: number; y: number }) => void;
  /** Single tap callback (maps to stage click / select) */
  onSingleTap?: () => void;
  /** Double tap → zoom-to-fit callback */
  onDoubleTap?: () => void;
  /** Viewport lock — when true, pinch zoom & two-finger pan are disabled (PR-UX-3 ETAP 4) */
  locked?: boolean;
}

const PINCH_ZOOM_SENSITIVITY_BASE = 0.005;
const DOUBLE_TAP_DELAY = 300; // ms
const DOUBLE_TAP_DISTANCE_THRESHOLD = 30; // px — max movement allowed between taps
const PAN_CLAMP_MARGIN = 200;

export function useTouchGestures(options: TouchGesturesOptions) {
  const {
    containerRef,
    canvasWidth,
    canvasHeight,
    containerSize,
    fitZoom,
    panOffset,
    setPanOffset,
    onSingleTap,
    onDoubleTap,
    locked = false,
  } = options;

  // ─── Refs for gesture tracking (avoid re-renders) ───────────────────
  const pinchStateRef = useRef<{
    active: boolean;
    startDist: number;
    startZoom: number;
    startPanOffset: { x: number; y: number };
    lastCenter: { x: number; y: number };
  }>({ active: false, startDist: 0, startZoom: 1, startPanOffset: { x: 0, y: 0 }, lastCenter: { x: 0, y: 0 } });

  const tapTrackerRef = useRef<{
    lastTapTime: number;
    lastTapX: number;
    lastTapY: number;
    tapTimeout: ReturnType<typeof setTimeout> | null;
  }>({ lastTapTime: 0, lastTapX: 0, lastTapY: 0, tapTimeout: null });

  // ─── Main touch handler effect ──────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // ETAP 4: lock prevents pinch zoom & two-finger pan
        if (locked) return;
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        pinchStateRef.current = {
          active: true,
          startDist: dist,
          startZoom: useUIStore.getState().zoom,
          startPanOffset: { x: panOffset.x, y: panOffset.y },
          lastCenter: center,
        };
      } else if (e.touches.length === 1) {
        // ── Track single touches for tap detection ──
        const now = Date.now();
        const touch = e.touches[0];
        const tx = touch.clientX;
        const ty = touch.clientY;

        // Clear any pending single-tap timeout
        if (tapTrackerRef.current.tapTimeout) {
          clearTimeout(tapTrackerRef.current.tapTimeout);
          tapTrackerRef.current.tapTimeout = null;
        }

        const dt = now - tapTrackerRef.current.lastTapTime;
        const dx = Math.abs(tx - tapTrackerRef.current.lastTapX);
        const dy = Math.abs(ty - tapTrackerRef.current.lastTapY);

        if (dt < DOUBLE_TAP_DELAY && dx < DOUBLE_TAP_DISTANCE_THRESHOLD && dy < DOUBLE_TAP_DISTANCE_THRESHOLD) {
          // ── Double tap detected ──
          tapTrackerRef.current.lastTapTime = 0;
          onDoubleTap?.();
        } else {
          // ── Potential single tap — delay to wait for double tap ──
          tapTrackerRef.current.lastTapTime = now;
          tapTrackerRef.current.lastTapX = tx;
          tapTrackerRef.current.lastTapY = ty;
          tapTrackerRef.current.tapTimeout = setTimeout(() => {
            onSingleTap?.();
            tapTrackerRef.current.tapTimeout = null;
          }, DOUBLE_TAP_DELAY);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        const pinch = pinchStateRef.current;
        if (!pinch.active) return;

        // ── Delta-based pinch zoom ──
        // delta = (currentDist - startDist) * sensitivity * DPR
        const dpr = window.devicePixelRatio || 1;
        const deltaPixels = dist - pinch.startDist;
        const zoomDelta = deltaPixels * PINCH_ZOOM_SENSITIVITY_BASE * Math.sqrt(dpr);
        const newUserZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinch.startZoom * (1 + zoomDelta)));
        useUIStore.getState().setZoom(newUserZoom);

        // ── Two-finger pan ──
        const dx = center.x - pinch.lastCenter.x;
        const dy = center.y - pinch.lastCenter.y;
        const newEffective = newUserZoom * fitZoom;

        // Compute pan with clamp (using current start offset + movement)
        const newPanX = pinch.startPanOffset.x + dx;
        const newPanY = pinch.startPanOffset.y + dy;

        const clamped = clampPanOffset(
          newPanX, newPanY,
          canvasWidth * newEffective, canvasHeight * newEffective,
          containerSize.width, containerSize.height,
          PAN_CLAMP_MARGIN,
        );
        setPanOffset(clamped);

        pinch.lastCenter = center;
      } else if (e.touches.length === 1) {
        // Cancel tap if finger moved too far (scrolling, not tapping)
        if (tapTrackerRef.current.tapTimeout) {
          const touch = e.touches[0];
          const dx = Math.abs(touch.clientX - tapTrackerRef.current.lastTapX);
          const dy = Math.abs(touch.clientY - tapTrackerRef.current.lastTapY);
          if (dx > 10 || dy > 10) {
            clearTimeout(tapTrackerRef.current.tapTimeout);
            tapTrackerRef.current.tapTimeout = null;
            tapTrackerRef.current.lastTapTime = 0;
          }
        }
      }
    };

    const handleTouchEnd = () => {
      pinchStateRef.current.active = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (tapTrackerRef.current.tapTimeout) {
        clearTimeout(tapTrackerRef.current.tapTimeout);
      }
    };
  }, [
    containerRef, canvasWidth, canvasHeight, containerSize,
    fitZoom, panOffset, setPanOffset, onSingleTap, onDoubleTap, locked,
  ]);
}