/**
 * BoardCanvasSection - Canvas rendering section for BoardPage
 *
 * Viewport model (Figma/Miro scroll-based):
 * - Stage physical size = canvasWidth * effectiveZoom × canvasHeight * effectiveZoom
 * - Stage scaleX/scaleY = effectiveZoom (Konva coords always in world-space)
 * - Stage x=0, y=0 (no Konva-level pan offset)
 * - Container has overflow:auto → viewport scrolls naturally
 * - Scroll position replaces panOffset for pan behavior
 * - Ctrl/Cmd+wheel zooms and repositions scroll to keep cursor point stable
 * - Space+drag = scroll pan (desktop)
 * - Pinch = zoom + scroll
 */

import { ReactNode, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type Konva from 'konva';
import { DEFAULT_PITCH_SETTINGS, isPlayerElement } from '@tmc/core';
import type { BoardElement, Position, PitchSettings, TeamSettings, PlayerOrientationSettings } from '@tmc/core';
import { CanvasShell } from '../../components/CanvasShell';
import { BoardCanvas } from '../../components/Canvas/BoardCanvas';
import { CanvasAdapter } from './canvas/CanvasAdapter';
import { useUIStore, ZOOM_MIN, ZOOM_MAX } from '../../store/useUIStore';
// viewportUtils retained for future use (getWorldPointer still used by other modules)
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
}

// ─── Constants ──────────────────────────────────────────────────────────
const MIN_CONTAINER_SIZE = 200;
const MAX_FIT_UPSCALE = 1.5;
const WHEEL_ZOOM_FACTOR = 0.001; // sensitivity for Ctrl+Cmd+wheel zoom
const CANVAS_PADDING = 40; // padding around pitch in scrollable area

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
  } = props;

  const setZoom = useUIStore((s) => s.setZoom);

  // ─── Outer scroll container ─────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = scrollRef.current;
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

  // ─── Fit-zoom computation (scale that fits pitch to viewport) ────────
  const containerPadding = useMemo(() => containerSize.width < 768 ? 16 : 24, [containerSize.width]);

  const fitZoom = containerSize.width > MIN_CONTAINER_SIZE && containerSize.height > MIN_CONTAINER_SIZE
    ? Math.min(
        (containerSize.width - containerPadding) / canvasWidth,
        (containerSize.height - containerPadding) / canvasHeight,
        MAX_FIT_UPSCALE,
      )
    : 1;

  const effectiveZoom = zoom * fitZoom;

  // ─── Physical Stage size in pixels ──────────────────────────────────
  // Stage renders at full world size * effectiveZoom so viewport can scroll
  const stagePixelWidth = Math.round(canvasWidth * effectiveZoom);
  const stagePixelHeight = Math.round(canvasHeight * effectiveZoom);

  // ─── Space+drag: convert to scroll pan ──────────────────────────────
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panScrollStartRef = useRef({ left: 0, top: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) setSpaceHeld(true);
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

  const handleScrollPointerDown = useCallback((e: React.PointerEvent) => {
    if (!spaceHeld) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
    panScrollStartRef.current = {
      left: scrollRef.current?.scrollLeft ?? 0,
      top: scrollRef.current?.scrollTop ?? 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }, [spaceHeld]);

  const handleScrollPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current || !scrollRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    scrollRef.current.scrollLeft = panScrollStartRef.current.left - dx;
    scrollRef.current.scrollTop = panScrollStartRef.current.top - dy;
  }, []);

  const handleScrollPointerUp = useCallback((e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  // ─── Ctrl/Cmd+Wheel zoom-to-cursor ──────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.altKey) return;
      e.preventDefault();

      const currentZoom = useUIStore.getState().zoom;
      const currentFitZoom = fitZoom;
      const currentEffective = currentZoom * currentFitZoom;

      const delta = -e.deltaY * WHEEL_ZOOM_FACTOR;
      const newUserZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * (1 + delta)));
      const newEffective = newUserZoom * currentFitZoom;

      // Cursor position relative to scroll container
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // World point under cursor (in canvas world coords)
      const worldX = (cursorX + el.scrollLeft) / currentEffective;
      const worldY = (cursorY + el.scrollTop) / currentEffective;

      // New scroll to keep world point under cursor
      const newScrollLeft = worldX * newEffective - cursorX;
      const newScrollTop = worldY * newEffective - cursorY;

      setZoom(newUserZoom);

      // Apply scroll on next frame (after Stage resizes)
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = newScrollLeft;
          scrollRef.current.scrollTop = newScrollTop;
        }
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [fitZoom, setZoom]);

  // ─── Touch: pinch zoom + two-finger pan ─────────────────────────────
  // Reuse useTouchGestures but scroll-based pan
  const containerRefAlias = scrollRef as React.RefObject<HTMLDivElement | null>;
  const [_panOffset, _setPanOffset] = useState({ x: 0, y: 0 });

  useTouchGestures({
    containerRef: containerRefAlias,
    canvasWidth,
    canvasHeight,
    containerSize,
    fitZoom,
    panOffset: _panOffset,
    setPanOffset: useCallback(({ x, y }: { x: number; y: number }) => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = -x;
        scrollRef.current.scrollTop = -y;
      }
    }, []),
    onDoubleTap: useCallback(() => {
      useUIStore.getState().zoomFit();
    }, []),
  });

  // ─── Reset scroll to center when zoom returns to fit ─────────────────
  useEffect(() => {
    if (zoom <= 1 && scrollRef.current) {
      const el = scrollRef.current;
      // Center the pitch
      const overflowX = Math.max(0, stagePixelWidth - el.clientWidth);
      const overflowY = Math.max(0, stagePixelHeight - el.clientHeight);
      el.scrollLeft = overflowX / 2;
      el.scrollTop = overflowY / 2;
    }
  }, [zoom, stagePixelWidth, stagePixelHeight]);

  // ─── Cursor style ────────────────────────────────────────────────────
  const cursorClass = spaceHeld
    ? (isPanningRef.current ? 'cursor-grabbing' : 'cursor-grab')
    : '';

  return (
    <div
      ref={scrollRef}
      className={`shadow-canvas rounded-[20px] border border-border/50 bg-surface/50 backdrop-blur-sm overflow-auto ${cursorClass}`}
      style={{
        touchAction: 'manipulation',
        // Fill parent flex container
        flex: 1,
        minWidth: 0,
        minHeight: 0,
      }}
      onPointerDown={handleScrollPointerDown}
      onPointerMove={handleScrollPointerMove}
      onPointerUp={handleScrollPointerUp}
    >
      {/* Inner div sized to the full zoomed canvas — scroll happens here */}
      <div
        style={{
          width: stagePixelWidth,
          height: stagePixelHeight,
          minWidth: stagePixelWidth,
          minHeight: stagePixelHeight,
          padding: CANVAS_PADDING,
          boxSizing: 'content-box',
          position: 'relative',
        }}
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
            stagePosition={{ x: 0, y: 0 }}
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
    </div>
  );
}
