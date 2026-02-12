/**
 * BoardCanvasSection - Canvas rendering section for BoardPage
 * Contains CanvasShell, Stage, and all canvas layers.
 * 
 * Viewport model (PR-FIX-4):
 * - effectiveZoom = userZoom * fitZoom
 * - pitch always centered in container: centerX = (containerW - scaledW) / 2
 * - stagePosition = { x: centerX + panX, y: centerY + panY }
 * - pan via Space+drag (desktop) or two-finger drag (mobile)
 * - Ctrl/Cmd+wheel = zoom to cursor
 * - Fit resets panOffset to {0,0}
 */

import { ReactNode, useState, useRef, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import { DEFAULT_PITCH_SETTINGS, isPlayerElement } from '@tmc/core';
import type { BoardElement, Position, PitchSettings, TeamSettings, PlayerOrientationSettings } from '@tmc/core';
import { CanvasShell } from '../../components/CanvasShell';
import { BoardCanvas } from '../../components/Canvas/BoardCanvas';
import { CanvasAdapter } from './canvas/CanvasAdapter';
import { useUIStore, ZOOM_MIN, ZOOM_MAX } from '../../store/useUIStore';
import { computeZoomToCursorPan, clampPanOffset, screenToWorld } from '../../utils/viewportUtils';

export interface BoardCanvasSectionProps {
  // Canvas config
  stageRef: React.RefObject<Konva.Stage>;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  pitchConfig: ReturnType<typeof import('@tmc/core').getPitchDimensions>;
  pitchSettings: PitchSettings;
  teamSettings: TeamSettings;
  playerOrientationSettings: PlayerOrientationSettings;
  gridVisible: boolean;
  layerVisibility: {
    zones: boolean;
    arrows: boolean;
    homePlayers: boolean;
    awayPlayers: boolean;
    ball: boolean;
    labels: boolean;
  };
  hiddenByGroup: Set<string>;
  
  // Board state
  elements: BoardElement[];
  selectedIds: string[];
  isPlaying: boolean;
  activeTool: string | null;
  isPrintMode: boolean;
  
  // Marquee state
  marqueeStart: Position | null;
  marqueeEnd: Position | null;
  
  // Drawing state
  drawingStart: Position | null;
  drawingEnd: Position | null;
  freehandPoints: number[] | null;
  
  // Animation state
  animationProgress: number;
  nextStepElements: BoardElement[] | null;
  
  // Empty state overlay
  emptyStateOverlay: ReactNode;
  
  // Event handlers
  onStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseDown: (e: any) => void;
  onStageMouseMove: (e: any) => void;
  onStageMouseUp: () => void;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  onElementSelect: (id: string, addToSelection: boolean) => void;
  onElementDragEnd: (id: string, position: Position) => void;
  onElementDragStart: (id: string, mouseX?: number, mouseY?: number) => boolean;
  onResizeZone: (id: string, position: Position, width: number, height: number) => void;
  onUpdateArrowEndpoint: (id: string, endpoint: 'start' | 'end', position: Position) => void;
  onPlayerQuickEdit: (id: string, currentNumber: number) => void;
  onTextDoubleClick: (id: string) => void;
  pushHistory: () => void;
  
  // Interpolation helpers
  getInterpolatedPosition: (elementId: string, currentPos: Position) => Position;
  getInterpolatedZone: (elementId: string, currentPos: Position, width: number, height: number) => { position: Position; width: number; height: number };
  getInterpolatedArrowEndpoints: (elementId: string, start: Position, end: Position) => { start: Position; end: Position };
  
  // Feature flag
  useNewCanvas?: boolean;
  activeCanvasInteraction?: any;
}

// ─── Constants ──────────────────────────────────────────────────────────
const CONTAINER_PADDING = 24;
const MIN_CONTAINER_SIZE = 200;
const MAX_FIT_UPSCALE = 1.3;
const PAN_CLAMP_MARGIN = 80;
const WHEEL_ZOOM_FACTOR = 0.001; // sensitivity for Ctrl+wheel zoom

export function BoardCanvasSection(props: BoardCanvasSectionProps) {
  const {
    stageRef,
    canvasWidth,
    canvasHeight,
    zoom,
    pitchConfig,
    pitchSettings,
    teamSettings,
    playerOrientationSettings,
    gridVisible,
    layerVisibility,
    hiddenByGroup,
    elements,
    selectedIds,
    isPlaying,
    activeTool,
    isPrintMode,
    marqueeStart,
    marqueeEnd,
    drawingStart,
    drawingEnd,
    freehandPoints,
    emptyStateOverlay,
    onStageClick,
    onStageMouseDown,
    onStageMouseMove,
    onStageMouseUp,
    onContextMenu,
    onElementSelect,
    onElementDragEnd,
    onElementDragStart,
    onResizeZone,
    onUpdateArrowEndpoint,
    onPlayerQuickEdit,
    onTextDoubleClick,
    pushHistory,
    getInterpolatedPosition,
    getInterpolatedZone,
    getInterpolatedArrowEndpoints,
    useNewCanvas = false,
    activeCanvasInteraction,
  } = props;

  const setZoom = useUIStore((s) => s.setZoom);

  // ─── Container measurement ───────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ─── Fit-zoom computation ────────────────────────────────────────────
  const fitZoom = containerSize.width > MIN_CONTAINER_SIZE && containerSize.height > MIN_CONTAINER_SIZE
    ? Math.min(
        (containerSize.width - CONTAINER_PADDING) / canvasWidth,
        (containerSize.height - CONTAINER_PADDING) / canvasHeight,
        MAX_FIT_UPSCALE,
      )
    : 1;

  const effectiveZoom = zoom * fitZoom;

  // ─── Pan state ───────────────────────────────────────────────────────
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Refs for pan interaction (avoid re-renders during drag)
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  
  // Mobile pinch state
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // ─── Space key tracking ──────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        // Don't prevent default here — let useKeyboardShortcuts handle that
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        isPanningRef.current = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ─── Clamp helper ────────────────────────────────────────────────────
  const clampPan = useCallback((px: number, py: number, scale?: number) => {
    const s = scale ?? effectiveZoom;
    return clampPanOffset(
      px, py,
      canvasWidth * s, canvasHeight * s,
      containerSize.width, containerSize.height,
      PAN_CLAMP_MARGIN,
    );
  }, [canvasWidth, canvasHeight, effectiveZoom, containerSize]);

  // ─── Space+drag panning (desktop) ───────────────────────────────────
  const handleContainerPointerDown = useCallback((e: React.PointerEvent) => {
    if (!spaceHeld) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOffsetStartRef.current = { x: panOffset.x, y: panOffset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }, [spaceHeld, panOffset]);

  const handleContainerPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    const clamped = clampPan(panOffsetStartRef.current.x + dx, panOffsetStartRef.current.y + dy);
    setPanOffset(clamped);
  }, [clampPan]);

  const handleContainerPointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  // ─── Ctrl/Cmd+Wheel zoom-to-cursor ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle Ctrl/Cmd+wheel for zoom
      if (!e.ctrlKey && !e.metaKey) return;
      
      // Don't handle if Alt is pressed (Alt+wheel = player orientation)
      if (e.altKey) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      // Get current zoom state
      const currentZoom = useUIStore.getState().zoom;
      const currentFitZoom = fitZoom; // captured from closure
      const currentEffective = currentZoom * currentFitZoom;
      
      // Compute new zoom
      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
      const newUserZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * (1 + delta)));
      const newEffective = newUserZoom * currentFitZoom;
      
      // Get container-relative pointer position
      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      // Compute world point under cursor at OLD scale
      const scaledW = canvasWidth * currentEffective;
      const scaledH = canvasHeight * currentEffective;
      const centerX = (containerSize.width - scaledW) / 2;
      const centerY = (containerSize.height - scaledH) / 2;
      const stageX = centerX + panOffset.x;
      const stageY = centerY + panOffset.y;
      
      const world = screenToWorld(screenX, screenY, stageX, stageY, currentEffective);
      
      // Compute new panOffset to keep world point under cursor
      const newPan = computeZoomToCursorPan(
        screenX, screenY,
        world.x, world.y,
        newEffective,
        containerSize.width, containerSize.height,
        canvasWidth, canvasHeight,
      );
      
      // Clamp and apply
      const clamped = clampPanOffset(
        newPan.x, newPan.y,
        canvasWidth * newEffective, canvasHeight * newEffective,
        containerSize.width, containerSize.height,
        PAN_CLAMP_MARGIN,
      );
      
      setPanOffset(clamped);
      setZoom(newUserZoom);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [fitZoom, canvasWidth, canvasHeight, containerSize, panOffset, setZoom]);

  // ─── Mobile: pinch zoom + two-finger pan ─────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        lastPinchDistRef.current = dist;
        lastPinchCenterRef.current = center;
        panOffsetStartRef.current = { x: panOffset.x, y: panOffset.y };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastPinchDistRef.current === null) return;
      e.preventDefault();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      // Pinch zoom
      const scale = dist / lastPinchDistRef.current;
      const currentZoom = useUIStore.getState().zoom;
      const newUserZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * scale));
      setZoom(newUserZoom);
      lastPinchDistRef.current = dist;

      // Two-finger pan
      if (lastPinchCenterRef.current) {
        const dx = center.x - lastPinchCenterRef.current.x;
        const dy = center.y - lastPinchCenterRef.current.y;
        const newEffective = newUserZoom * fitZoom;
        const clamped = clampPanOffset(
          panOffset.x + dx, panOffset.y + dy,
          canvasWidth * newEffective, canvasHeight * newEffective,
          containerSize.width, containerSize.height,
          PAN_CLAMP_MARGIN,
        );
        setPanOffset(clamped);
      }
      lastPinchCenterRef.current = center;
    };

    const handleTouchEnd = () => {
      lastPinchDistRef.current = null;
      lastPinchCenterRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [fitZoom, canvasWidth, canvasHeight, containerSize, panOffset, setZoom]);

  // ─── Reset pan when zoom returns to fit ──────────────────────────────
  useEffect(() => {
    if (zoom <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  // ─── Center + pan → Stage position ──────────────────────────────────
  const scaledW = canvasWidth * effectiveZoom;
  const scaledH = canvasHeight * effectiveZoom;
  const centerX = (containerSize.width - scaledW) / 2;
  const centerY = (containerSize.height - scaledH) / 2;

  const stagePosition = {
    x: centerX + panOffset.x,
    y: centerY + panOffset.y,
  };

  // ─── Cursor style ───────────────────────────────────────────────────
  const cursorClass = spaceHeld
    ? (isPanningRef.current ? 'cursor-grabbing' : 'cursor-grab')
    : '';

  return (
    <div
      ref={containerRef}
      className={`shadow-canvas rounded-[20px] border border-border/50 p-3 bg-surface/50 backdrop-blur-sm ${cursorClass}`}
      style={{ touchAction: 'none' /* prevent browser gestures on canvas */ }}
      onPointerDown={handleContainerPointerDown}
      onPointerMove={handleContainerPointerMove}
      onPointerUp={handleContainerPointerUp}
    >
      <CanvasShell emptyStateOverlay={emptyStateOverlay}>
        {useNewCanvas ? (
          <BoardCanvas
            ref={stageRef}
            width={canvasWidth}
            height={canvasHeight}
            elements={elements}
            selectedIds={selectedIds}
            pitchConfig={pitchConfig}
            pitchSettings={pitchSettings ?? DEFAULT_PITCH_SETTINGS}
            teamSettings={teamSettings ?? { home: { primaryColor: '#3b82f6', secondaryColor: '#1e40af', name: 'Home' }, away: { primaryColor: '#ef4444', secondaryColor: '#b91c1c', name: 'Away' } }}
            gridVisible={gridVisible}
            layerVisibility={{
              zones: layerVisibility.zones,
              arrows: layerVisibility.arrows,
              homePlayers: layerVisibility.homePlayers,
              awayPlayers: layerVisibility.awayPlayers,
              ball: layerVisibility.ball,
              equipment: true,
              text: layerVisibility.labels,
              drawings: true,
            }}
            hiddenByGroup={hiddenByGroup}
            isPlaying={isPlaying}
            freehandPoints={freehandPoints ? freehandPoints.map((val, idx) => idx % 2 === 0 ? { x: val, y: freehandPoints[idx + 1] ?? 0 } : null).filter((p): p is { x: number; y: number } => p !== null) : null}
            freehandType={
              activeTool === 'highlighter' ? 'highlighter' :
              activeTool === 'drawing' ? 'drawing' :
              null
            }
            marqueeStart={marqueeStart}
            marqueeEnd={marqueeEnd}
            onStageClick={onStageClick}
            onStageMouseDown={onStageMouseDown}
            onStageMouseMove={onStageMouseMove}
            onStageMouseUp={onStageMouseUp}
            onElementSelect={activeCanvasInteraction?.handleElementSelect}
            onElementDragEnd={activeCanvasInteraction?.handleElementDragEnd}
            onElementDragStart={activeCanvasInteraction?.handleDragStart}
            onResizeZone={onResizeZone}
            onUpdateArrowEndpoint={onUpdateArrowEndpoint}
            onPlayerQuickEdit={(id) => {
              const player = elements.find(el => el.id === id && isPlayerElement(el));
              if (player && isPlayerElement(player)) {
                onPlayerQuickEdit(id, player.number ?? 0);
              }
            }}
          />
        ) : (
          <CanvasAdapter
            stageRef={stageRef}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            stageScale={effectiveZoom}
            stagePosition={stagePosition}
            pitchConfig={pitchConfig}
            pitchSettings={pitchSettings}
            teamSettings={teamSettings}
            playerOrientationSettings={playerOrientationSettings}
            gridVisible={gridVisible}
            zoom={zoom}
            layerVisibility={layerVisibility}
            hiddenByGroup={hiddenByGroup}
            elements={elements}
            selectedIds={selectedIds}
            isPlaying={isPlaying}
            activeTool={activeTool}
            isPrintMode={isPrintMode}
            marqueeStart={marqueeStart}
            marqueeEnd={marqueeEnd}
            drawingStart={drawingStart}
            drawingEnd={drawingEnd}
            freehandPoints={freehandPoints}
            onStageClick={onStageClick}
            onStageMouseDown={onStageMouseDown}
            onStageMouseMove={onStageMouseMove}
            onStageMouseUp={onStageMouseUp}
            onContextMenu={onContextMenu}
            onElementSelect={onElementSelect}
            onElementDragEnd={onElementDragEnd}
            onElementDragStart={onElementDragStart}
            onResizeZone={onResizeZone}
            onUpdateArrowEndpoint={onUpdateArrowEndpoint}
            onPlayerQuickEdit={onPlayerQuickEdit}
            onTextDoubleClick={onTextDoubleClick}
            pushHistory={pushHistory}
            getInterpolatedPosition={getInterpolatedPosition}
            getInterpolatedZone={getInterpolatedZone}
            getInterpolatedArrowEndpoints={getInterpolatedArrowEndpoints}
          />
        )}
      </CanvasShell>
    </div>
  );
}
