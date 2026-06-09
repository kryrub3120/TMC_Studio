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
import { zoomToCursorPan, clampPanOffset, centerPanOffset } from '../../utils/viewportUtils';
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
  const viewportLocked = useUIStore((s) => s.viewportLocked); // ETAP 4

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
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Refs for pan interaction (avoid re-renders during drag)
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetStartRef = useRef({ x: 0, y: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  // ─── ETAP 3: Track first valid container measurement for initial center ──
  const hasInitializedRef = useRef(false);

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
    // ✅ IMPERATIVE read — stale closure proof
    if (useUIStore.getState().viewportLocked) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panOffsetStartRef.current = { x: panOffset.x, y: panOffset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }, [spaceHeld, panOffset]);

  const handleContainerPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    // ✅ IMPERATIVE read — catch mid-pan lock toggle
    if (useUIStore.getState().viewportLocked) {
      isPanningRef.current = false;
      return;
    }
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
      // ETAP 4: lock prevents wheel zoom
      if (useUIStore.getState().viewportLocked) return;
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
      let newPan = zoomToCursorPan(screenX, screenY, worldX, worldY, newEffective);

      // 🎯 BUG 2: Enforce auto-center when scaled pitch fits in container
      const physW = canvasWidth * newEffective;
      const physH = canvasHeight * newEffective;
      const cw = containerSize.width;
      const ch = containerSize.height;
      if (physW < cw) {
        newPan = { ...newPan, x: (cw - physW) / 2 };
      }
      if (physH < ch) {
        newPan = { ...newPan, y: (ch - physH) / 2 };
      }

      // Clamp pan
      const clamped = clampPanOffset(
        newPan.x, newPan.y,
        physW, physH,
        cw, ch,
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
    locked: viewportLocked, // ETAP 4: lock prevents pinch & two-finger pan
    onDoubleTap: useCallback(() => {
      useUIStore.getState().zoomFit();
    }, []),
  });

  // ─── 🎯 BUG 2: Auto-center whenever zoom changes and scaled pitch fits ──
  // Runs on zoom change (wheel, buttons, shortcuts) to force the pitch
  // back to viewport center whenever the scaled dimensions are smaller.
  useEffect(() => {
    const eff = zoom * fitZoom;
    const physW = canvasWidth * eff;
    const physH = canvasHeight * eff;
    const cw = containerSize.width;
    const ch = containerSize.height;

    if (physW < cw || physH < ch) {
      setPanOffset((prev) => ({
        x: physW < cw ? (cw - physW) / 2 : prev.x,
        y: physH < ch ? (ch - physH) / 2 : prev.y,
      }));
    }
  }, [zoom, fitZoom, canvasWidth, canvasHeight, containerSize]);

  // ─── ETAP 3: Auto-fit on first valid container measurement ─────────
  // Centers the pitch on first load so it never sticks to top-left.
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (containerSize.width <= MIN_CONTAINER_SIZE || containerSize.height <= MIN_CONTAINER_SIZE) return;

    hasInitializedRef.current = true;
    const centerPan = centerPanOffset(
      containerSize.width, containerSize.height,
      canvasWidth, canvasHeight,
      effectiveZoom,
    );
    setPanOffset(centerPan);
  }, [containerSize, canvasWidth, canvasHeight, effectiveZoom]);

  // ─── ETAP 3: Auto-center on window resize when zoom ≤ 1 ────────────
  // When user shrinks the window below 100% zoom level, re-center so
  // the pitch doesn't stick to top-left corner.
  useEffect(() => {
    const handleResize = () => {
      // Use store's zoom (userZoom, not effective) to check if at/below fit
      const userZoom = useUIStore.getState().zoom;
      if (userZoom > 1) return; // only center when zoomed out

      // Need a rAF to let ResizeObserver update containerSize first
      // — but our centering effect above runs on containerSize dependency.
      // This resize handler just triggers a setState no-op to force re-render
      // with the already-updated containerSize from ResizeObserver.
      // Actually the existing fitZoom + centering effect already runs.
      // We just need to setPanOffset back to center.
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      if (cw <= MIN_CONTAINER_SIZE || ch <= MIN_CONTAINER_SIZE) return;

      const eff = userZoom * fitZoom;
      const centerPan = centerPanOffset(cw, ch, canvasWidth, canvasHeight, eff);
      setPanOffset(centerPan);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitZoom, canvasWidth, canvasHeight]);

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
