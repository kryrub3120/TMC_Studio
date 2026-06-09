/**
 * BoardCanvasSection - Canvas rendering section for BoardPage
 * Contains CanvasShell, Stage, and all canvas layers.
 *
 * True Virtual Canvas Model:
 * - Stage fills the container (width=containerW, height=containerH), scale=1, x=y=0
 * - Root Group inside Stage holds transform: scaleX/Y=effectiveZoom, x/y=panOffset
 * - World coords stable: worldX = (screenX - panX) / zoom
 * - Ctrl/Cmd+wheel = zoom to cursor point
 * - Space+drag = pan (modifies panOffset directly)
 * - Fit = reset pan so pitch centered, zoom=1
 */

import { ReactNode, useState, useRef, useEffect, useCallback, useMemo, MutableRefObject } from 'react';
import type Konva from 'konva';
import { DEFAULT_PITCH_SETTINGS, isPlayerElement } from '@tmc/core';
import type { BoardElement, Position, PitchSettings, TeamSettings, PlayerOrientationSettings } from '@tmc/core';
import { CanvasShell } from '../../components/CanvasShell';
import { BoardCanvas } from '../../components/Canvas/BoardCanvas';
import { CanvasAdapter } from './canvas/CanvasAdapter';
import { useUIStore, ZOOM_MIN, ZOOM_MAX } from '../../store/useUIStore';
import { zoomToCursorPan, clampPanOffset } from '../../utils/viewportUtils';
import { useTouchGestures } from '../../hooks/useTouchGestures';

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
  
  // ALT+Drag rotation
  onOrientationPreview: (id: string, orientation: number) => void;
  onOrientationCommit: (id: string, orientation: number) => void;
  
  // Interpolation helpers
  getInterpolatedPosition: (elementId: string, currentPos: Position) => Position;
  getInterpolatedZone: (elementId: string, currentPos: Position, width: number, height: number) => { position: Position; width: number; height: number };
  getInterpolatedArrowEndpoints: (elementId: string, start: Position, end: Position) => { start: Position; end: Position };
  
  // Feature flag
  useNewCanvas?: boolean;
  activeCanvasInteraction?: any;
  /**
   * PR-UX-3 ETAP 1: Optional ref that BoardCanvasSection keeps up-to-date with the
   * current viewport transform. Allows sibling hooks (useStageEventHandlers) to
   * read { panX, panY, zoom } without re-render coupling.
   */
  viewportTransformRef?: MutableRefObject<{ panX: number; panY: number; zoom: number }>;
}

// ─── Constants ──────────────────────────────────────────────────────────
const MIN_CONTAINER_SIZE = 200;
const MAX_FIT_UPSCALE = 1.5;
const PAN_CLAMP_MARGIN = 200;
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
    onOrientationPreview,
    onOrientationCommit,
    getInterpolatedPosition,
    getInterpolatedZone,
    getInterpolatedArrowEndpoints,
    useNewCanvas = false,
    activeCanvasInteraction,
    viewportTransformRef,
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

  // ─── Responsive container padding ────────────────────────────────────
  const containerPadding = useMemo(() => {
    return containerSize.width < 768 ? 16 : 24;
  }, [containerSize.width]);

  // ─── Fit-zoom computation ────────────────────────────────────────────
  const fitZoom = containerSize.width > MIN_CONTAINER_SIZE && containerSize.height > MIN_CONTAINER_SIZE
    ? Math.min(
        (containerSize.width - containerPadding) / canvasWidth,
        (containerSize.height - containerPadding) / canvasHeight,
        MAX_FIT_UPSCALE,
      )
    : 1;

  const effectiveZoom = zoom * fitZoom;

  // ─── Pan state (= Group x/y offset) ─────────────────────────────────
  // Initial value: {0,0}; first ResizeObserver fires and centering effect sets it
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Refs for pan interaction (avoid re-renders during drag)
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

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

  // ─── Ctrl/Cmd+Wheel zoom-to-cursor (True Virtual Canvas) ────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.altKey) return;
      e.preventDefault();
      e.stopPropagation();

      const currentZoom = useUIStore.getState().zoom;
      const currentEffective = currentZoom * fitZoom;

      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
      const newUserZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * (1 + delta)));
      const newEffective = newUserZoom * fitZoom;

      // Cursor position relative to container
      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // World point under cursor at OLD zoom (using current groupPan)
      const worldX = (screenX - groupPan.x) / currentEffective;
      const worldY = (screenY - groupPan.y) / currentEffective;

      // New pan so same world point stays under cursor
      const newPan = zoomToCursorPan(screenX, screenY, worldX, worldY, newEffective);

      // Clamp pan
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

  // ─── Mobile: pinch zoom + two-finger pan (via hook) ────────────────
  useTouchGestures({
    containerRef,
    canvasWidth,
    canvasHeight,
    containerSize,
    fitZoom,
    panOffset,
    setPanOffset,
    onDoubleTap: useCallback(() => {
      useUIStore.getState().zoomFit();
    }, []),
  });

  // ─── Reset pan to center when zoom returns to fit ────────────────────
  useEffect(() => {
    if (zoom <= 1) {
      // Center: Group origin at (containerW/2 - canvasW/2, containerH/2 - canvasH/2) * fitZoom
      const eff = 1 * fitZoom;
      const centerX = (containerSize.width - canvasWidth * eff) / 2;
      const centerY = (containerSize.height - canvasHeight * eff) / 2;
      setPanOffset({ x: centerX, y: centerY });
    }
  }, [zoom, fitZoom, canvasWidth, canvasHeight, containerSize]);

  // ─── Group transform (panOffset IS groupPan directly) ───────────────
  // In True Virtual Canvas: panOffset = {x: groupPanX, y: groupPanY}
  const groupPan = panOffset;

  // ─── Keep viewportTransformRef up-to-date (PR-UX-3 ETAP 1) ─────────
  // Runs on every render where effectiveZoom or panOffset changes.
  // This ref is read by useStageEventHandlers to convert screen→world.
  if (viewportTransformRef) {
    viewportTransformRef.current = {
      panX: groupPan.x,
      panY: groupPan.y,
      zoom: effectiveZoom,
    };
  }

  // ─── Cursor style ────────────────────────────────────────────────────
  const cursorClass = spaceHeld
    ? (isPanningRef.current ? 'cursor-grabbing' : 'cursor-grab')
    : '';

  return (
    <div
      ref={containerRef}
      className={`shadow-canvas rounded-[20px] border border-border/50 p-3 bg-surface/50 backdrop-blur-sm ${cursorClass}`}
      style={{ touchAction: 'manipulation' }}
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
            containerWidth={containerSize.width || canvasWidth}
            containerHeight={containerSize.height || canvasHeight}
            groupZoom={effectiveZoom}
            groupPan={groupPan}
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
            onOrientationPreview={onOrientationPreview}
            onOrientationCommit={onOrientationCommit}
            getInterpolatedPosition={getInterpolatedPosition}
            getInterpolatedZone={getInterpolatedZone}
            getInterpolatedArrowEndpoints={getInterpolatedArrowEndpoints}
          />
        )}
      </CanvasShell>
    </div>
  );
}
