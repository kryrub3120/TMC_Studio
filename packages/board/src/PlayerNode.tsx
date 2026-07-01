/**
 * Player node component for the tactical board
 * Performance optimized with React.memo
 */

import React, { useRef, useState, memo, useEffect } from 'react';
import { Group, Circle, Rect, RegularPolygon, Line, Text, Wedge, Arc } from 'react-konva';
import type Konva from 'konva';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';
import type { PlayerElement, Position, PitchConfig, TeamSettings, PlayerOrientationSettings, Team } from '@tmc/core';
import {
  snapToGrid,
  clampToBounds,
  DEFAULT_TEAM_SETTINGS,
  DEFAULT_PLAYER_ORIENTATION_SETTINGS,
  resolveReadableTextColor,
} from '@tmc/core';

/** Memoized text measurement using offscreen canvas */
const textMeasureCache = new Map<string, number>();
function measureTextWidth(text: string, fontSize: number, fontStyle: string, fontFamily: string): number {
  const key = `${text}|${fontSize}|${fontStyle}|${fontFamily}`;
  const cached = textMeasureCache.get(key);
  if (cached !== undefined) return cached;

  if (typeof document === 'undefined') {
    // SSR fallback: rough estimate
    const w = text.length * fontSize * 0.62;
    textMeasureCache.set(key, w);
    return w;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const w = text.length * fontSize * 0.62;
    textMeasureCache.set(key, w);
    return w;
  }
  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const w = metrics.width;
  textMeasureCache.set(key, w);
  return w;
}

const MAX_LABEL_PILL_WIDTH = 160;
const ORIENTATION_DRAG_SENSITIVITY = 1.35;
const norm360 = (a: number) => ((a % 360) + 360) % 360;

/** Compute shortest angular delta (wrap-safe) - CORRECTION #1 */
const deltaDeg = (from: number, to: number) => {
  let d = norm360(to) - norm360(from);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};

/** Team color configuration */
export interface TeamColors {
  fill: string;
  stroke: string;
  text: string;
}

export interface PlayerNodeProps {
  player: PlayerElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  isLocked?: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
  teamSettings?: TeamSettings;
  onQuickEditNumber?: (id: string, currentNumber: number | null | undefined) => void;
  isPrintMode?: boolean;
  snapEnabled?: boolean;
  playerOrientationSettings?: PlayerOrientationSettings;
  /** zoom in PERCENT, e.g. 100 */
  zoom?: number;
  /** ALT+drag rotation callbacks */
  onOrientationPreview?: (id: string, orientation: number) => void;
  onOrientationCommit?: (id: string, orientation: number) => void;
}

/** Default goalkeeper color (yellow) */
const DEFAULT_GK_COLOR = '#fbbf24';

/** Sanitize white to black in print mode (inline, avoids cross-package import) */
function sanitizeForPrint(color: string, isPrintMode: boolean): string {
  if (isPrintMode && color.trim().toLowerCase() === '#ffffff') return '#000000';
  return color;
}

/** Darken hex color by percentage */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

/** Resolve goalkeeper status with backward-compatible priority:
 * 1. Explicit isGoalkeeper flag (if set) — new behavior
 * 2. number === 1 fallback — legacy behavior for old documents
 */
function resolveIsGoalkeeper(
  playerIsGoalkeeper: boolean | undefined,
  playerNumber: number | null | undefined
): boolean {
  return playerIsGoalkeeper !== undefined ? playerIsGoalkeeper : playerNumber === 1;
}

/** Convert team settings to render colors */
function getTeamColors(
  team: Team,
  teamSettings?: TeamSettings,
  isGoalkeeper?: boolean,
  playerColorOverride?: string,
  isPrintMode?: boolean
): TeamColors {
  const settings = teamSettings ?? DEFAULT_TEAM_SETTINGS;
  // Fallback chain for documents whose teamSettings predate team3/team4.
  const teamSetting = settings[team] ?? DEFAULT_TEAM_SETTINGS[team] ?? DEFAULT_TEAM_SETTINGS.home;

  // Priority: GK > player.color > team primary
  let primaryHex = isGoalkeeper
    ? (teamSetting.goalkeeperColor ?? DEFAULT_GK_COLOR)
    : (playerColorOverride ?? teamSetting.primaryColor);

  primaryHex = sanitizeForPrint(primaryHex, isPrintMode ?? false);

  return {
    fill: primaryHex,
    stroke: darkenColor(primaryHex, 20),
    // Prefer the team's chosen secondary color, but fall back to auto
    // black/white when it wouldn't be readable against the fill color
    // (e.g. green team + white text).
    text: resolveReadableTextColor(primaryHex, teamSetting.secondaryColor),
  };
}

const PLAYER_RADIUS = 18;
const SELECTED_STROKE_WIDTH = 3;
const NORMAL_STROKE_WIDTH = 2;

const PlayerNodeComponent: React.FC<PlayerNodeProps> = ({
  player,
  pitchConfig,
  isSelected,
  isLocked = false,
  onSelect,
  onDragEnd,
  onDragStart,
  teamSettings,
  onQuickEditNumber,
  isPrintMode,
  snapEnabled = true,
  playerOrientationSettings,
  zoom = 100,
  onOrientationPreview,
  onOrientationCommit,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);
  
  // Rotation state (CORRECTION #2, #5)
  const isRotatingRef = useRef(false);
  const startOrientationRef = useRef(0);
  const startPointerAngleRef = useRef(0);
  const lastAppliedAngleRef = useRef(0);
  const wasDraggableRef = useRef(true);

  const isGK = resolveIsGoalkeeper(player.isGoalkeeper, player.number);
  const colors = getTeamColors(player.team, teamSettings, isGK, player.color, isPrintMode);
  const r = player.radius ?? PLAYER_RADIUS;

  const orientationSettings = playerOrientationSettings ?? DEFAULT_PLAYER_ORIENTATION_SETTINGS;

  // orientationEnabled does NOT require player.orientation to be set —
  // orientation defaults to 0 (north) when undefined, so the feature works
  // for freshly-added players that have never had their angle adjusted.
  //
  // orientationMasterOn: master switch only (no zoom gating)
  // orientationEnabled: master + zoom threshold gate (for arms + text rotation)
  // Vision uses orientationMasterOn only — no zoom gating (lightweight, always visible when enabled)
  const orientationMasterOn = orientationSettings.enabled === true;
  const meetsZoomThreshold = zoom >= orientationSettings.zoomThreshold;
  const orientationEnabled = orientationMasterOn && meetsZoomThreshold;

  const showArms = orientationEnabled && orientationSettings.showArms === true;

  // Vision: requires master ON + global showVision explicitly true + per-player not hidden.
  // undefined → false (OFF by default). Old docs with undefined will now default to OFF.
  const globalShowVision = orientationSettings.showVision === true;
  const showVision = orientationMasterOn && globalShowVision && player.showVision !== false;

  // Konva: 0deg = RIGHT. My: 0deg = UP.
  const facingDeg = player.orientation ?? 0;
  const facingKonva = facingDeg - 90;

  // Numer zawodnika to identyfikator, nie kierunek — nigdy się nie obraca,
  // niezależnie od orientacji/ustawień ciała.
  const textRotation = 0;

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(player.id, addToSelection);
  };

  const handleDblClick = () => {
    onQuickEditNumber?.(player.id, player.number);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isLocked) {
      setMultiDragActive(false);
      return;
    }
    // ALT+drag anywhere on the player rotates it.
    if (e.evt.altKey && onOrientationPreview) {
      startRotationDrag(e);
      return;
    }
    if (onDragStart) {
      const stage = e.target.getStage();
      const rect = stage?.container().getBoundingClientRect();
      if (rect) {
        const shouldMultiDrag = onDragStart(
          player.id,
          e.evt.clientX - rect.left,
          e.evt.clientY - rect.top
        );
        if (shouldMultiDrag) {
          e.cancelBubble = true;
          setMultiDragActive(true);
          return;
        }
      }
    }
    setMultiDragActive(false);
  };

  const handleDragStart = () => {
    if (multiDragActive) return;
    setIsDragging(true);
    groupRef.current?.moveToTop();
    applyGrabbing(groupRef);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    applyGrab(groupRef);
    const node = e.target;

    const target = snapEnabled
      ? snapToGrid({ x: node.x(), y: node.y() }, pitchConfig.gridSize)
      : { x: node.x(), y: node.y() };
    const clamped = clampToBounds(target, pitchConfig);

    node.x(clamped.x);
    node.y(clamped.y);
    onDragEnd(player.id, clamped);
  };

  // --- ALT+DRAG ROTATION HANDLERS (CORRECTIONS #1-6) ---
  // Core rotation-drag start (used by ALT+drag on body AND by dragging the vision cone).
  const startRotationDrag = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!onOrientationPreview) return;
    
    e.cancelBubble = true;
    
    // Auto-select (single target for rotation)
    onSelect(player.id, false);
    
    // CORRECTION #5: Store previous draggable state
    const group = groupRef.current;
    if (group) {
      wasDraggableRef.current = group.draggable();
      group.draggable(false);
    }
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Get player center in stage coords
    const centerX = player.position.x;
    const centerY = player.position.y;
    
    // CORRECTION #3: Use rect-based coords (like ArrowNode)
    const rect = stage.container().getBoundingClientRect();
    const mouseX = e.evt.clientX - rect.left;
    const mouseY = e.evt.clientY - rect.top;
    
    // Transform screen → stage coords (account for scale/pan)
    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePoint = transform.point({ x: mouseX, y: mouseY });
    
    // Compute angle from center to pointer
    const dx = stagePoint.x - centerX;
    const dy = stagePoint.y - centerY;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    
    // Store initial state
    isRotatingRef.current = true;
    startOrientationRef.current = player.orientation ?? 0;
    startPointerAngleRef.current = angleDeg;
    lastAppliedAngleRef.current = startOrientationRef.current;
    
    // Attach window listeners
    window.addEventListener('mousemove', handleRotationMouseMove);
    window.addEventListener('mouseup', handleRotationMouseUp);
  };

  // Dragging the vision cone (when selected) rotates the player — no modifier needed.
  const handleVisionRotateStart = (e: Konva.KonvaEventObject<MouseEvent>) => {
    startRotationDrag(e);
  };

  const handleRotationMouseMove = (e: MouseEvent) => {
    if (!isRotatingRef.current || !onOrientationPreview) return;
    
    const stage = groupRef.current?.getStage();
    if (!stage) return;
    
    // CORRECTION #3: Use rect-based coords
    const rect = stage.container().getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Transform screen → stage coords
    const transform = stage.getAbsoluteTransform().copy().invert();
    const stagePoint = transform.point({ x: mouseX, y: mouseY });
    
    // Compute current angle
    const centerX = player.position.x;
    const centerY = player.position.y;
    const dx = stagePoint.x - centerX;
    const dy = stagePoint.y - centerY;
    const currentAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    
    // CORRECTION #1: Use wrap-safe delta
    const delta = deltaDeg(startPointerAngleRef.current, currentAngleDeg) * ORIENTATION_DRAG_SENSITIVITY;
    const rawOrientation = startOrientationRef.current + delta;
    
    // Smooth by default (1°); hold Shift for coarse 15° tactical snapping.
    const snapResolution = e.shiftKey ? 15 : 1;
    const snapped = Math.round(rawOrientation / snapResolution) * snapResolution;
    const normalized = norm360(snapped);
    
    // CORRECTION #2: Only dispatch if changed
    if (Math.abs(normalized - lastAppliedAngleRef.current) >= 0.5) {
      lastAppliedAngleRef.current = normalized;
      onOrientationPreview(player.id, normalized);
    }
  };

  const handleRotationMouseUp = () => {
    if (!isRotatingRef.current) return;
    
    // Commit final orientation
    if (onOrientationCommit) {
      onOrientationCommit(player.id, lastAppliedAngleRef.current);
    }
    
    // CORRECTION #5: Restore previous draggable state
    const group = groupRef.current;
    if (group) {
      group.draggable(wasDraggableRef.current);
    }
    
    // Clear state
    isRotatingRef.current = false;
    
    // Remove window listeners
    window.removeEventListener('mousemove', handleRotationMouseMove);
    window.removeEventListener('mouseup', handleRotationMouseUp);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleRotationMouseMove);
      window.removeEventListener('mouseup', handleRotationMouseUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- BODY ORIENTATION GEOMETRY ---
  // Premium tactical notation: shoulders + short curved arms, scaled to each player shape.
  const renderArms = () => {
    if (!showArms) return null;

    const rad = (facingKonva * Math.PI) / 180;
    const fX = Math.cos(rad);
    const fY = Math.sin(rad);

    const sideRad = rad + Math.PI / 2;
    const sX = Math.cos(sideRad);
    const sY = Math.sin(sideRad);

    const shape = player.shape ?? 'circle';
    const shapeReach = shape === 'triangle'
      ? 1.12
      : shape === 'diamond'
        ? 1.08
        : shape === 'square'
          ? 1.03
          : 1;

    // Long arms forming a V that OPENS TOWARD the facing/vision direction:
    // shoulders sit at the player's sides, hands reach far forward + outward.
    const shoulderForward = -r * 0.05;            // shoulders ~at centre, a touch back
    const shoulderSide = r * 0.55 * shapeReach;   // attach at the player's sides
    const handForward = r * 1.20;                 // hands well in front (toward vision)
    const handSide = r * 1.45 * shapeReach;       // hands spread wide → open V
    const elbowBow = r * 0.12;                     // slight outward bow → clearly bent

    const sx = fX * shoulderForward;
    const sy = fY * shoulderForward;

    // Shoulders (left/right)
    const slx = sx - sX * shoulderSide;
    const sly = sy - sY * shoulderSide;
    const srx = sx + sX * shoulderSide;
    const sry = sy + sY * shoulderSide;

    // Hands: forward (toward vision) + outward
    const elx = fX * handForward - sX * handSide;
    const ely = fY * handForward - sY * handSide;
    const erx = fX * handForward + sX * handSide;
    const ery = fY * handForward + sY * handSide;

    // Elbows: midpoint of shoulder->hand, bowed slightly outward
    const mlx = (slx + elx) / 2 - sX * elbowBow;
    const mly = (sly + ely) / 2 - sY * elbowBow;
    const mrx = (srx + erx) / 2 + sX * elbowBow;
    const mry = (sry + ery) / 2 + sY * elbowBow;

    const chestStartX = -sX * r * 0.22 - fX * r * 0.18;
    const chestStartY = -sY * r * 0.22 - fY * r * 0.18;
    const chestEndX = fX * r * 0.42;
    const chestEndY = fY * r * 0.42;

    const core = 'rgba(8, 15, 35, 0.72)';
    const highlight = 'rgba(255,255,255,0.34)';
    const shoulderGlow = 'rgba(255,255,255,0.72)';

    return (
      <>
        <Line
          points={[chestStartX, chestStartY, chestEndX, chestEndY]}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={Math.max(2, r * 0.13)}
          lineCap="round"
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[slx, sly, mlx, mly, elx, ely]}
          stroke={core}
          strokeWidth={Math.max(5, r * 0.31)}
          lineCap="round"
          lineJoin="round"
          tension={0.45}
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[srx, sry, mrx, mry, erx, ery]}
          stroke={core}
          strokeWidth={Math.max(5, r * 0.31)}
          lineCap="round"
          lineJoin="round"
          tension={0.45}
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[slx, sly, mlx, mly, elx, ely]}
          stroke={highlight}
          strokeWidth={Math.max(2, r * 0.13)}
          lineCap="round"
          lineJoin="round"
          tension={0.45}
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[srx, sry, mrx, mry, erx, ery]}
          stroke={highlight}
          strokeWidth={Math.max(2, r * 0.13)}
          lineCap="round"
          lineJoin="round"
          tension={0.45}
          listening={false}
          perfectDrawEnabled={false}
        />
        <Circle
          x={slx}
          y={sly}
          radius={Math.max(2.4, r * 0.15)}
          fill={shoulderGlow}
          listening={false}
          perfectDrawEnabled={false}
        />
        <Circle
          x={srx}
          y={sry}
          radius={Math.max(2.4, r * 0.15)}
          fill={shoulderGlow}
          listening={false}
          perfectDrawEnabled={false}
        />
      </>
    );
  };

  const renderVision = () => {
    if (!showVision) return null;

    // Vision cone: radius scales relative to player radius for consistency at all zoom levels.
    // Stroke added for clear boundary on green pitch.
    const visionRadius = r * 6;
    const visionStrokeWidth = Math.max(1, r * 0.08);

    return (
      <Wedge
        x={0}
        y={0}
        radius={visionRadius}
        angle={60}
        rotation={facingKonva - 30}
        fill={colors.fill}
        opacity={0.28}
        stroke={colors.fill}
        strokeWidth={visionStrokeWidth}
        strokeEnabled={true}
        listening={false}
        perfectDrawEnabled={false}
      />
    );
  };

  const renderBodyShape = () => {
    const common = {
      fill: colors.fill,
      stroke: isSelected ? '#ffd60a' : colors.stroke,
      strokeWidth: isSelected ? SELECTED_STROKE_WIDTH : NORMAL_STROKE_WIDTH,
      shadowColor: isDragging ? undefined : 'rgba(0,0,0,0.25)',
      shadowBlur: isDragging ? 0 : 3,
      shadowOffset: isDragging ? undefined : { x: 1, y: 1 },
      shadowEnabled: !isDragging,
      perfectDrawEnabled: false,
    } as const;

    if (!player.shape || player.shape === 'circle') {
      return <Circle x={0} y={0} radius={r} {...common} />;
    }

    if (player.shape === 'square') {
      return <Rect x={-r} y={-r} width={r * 2} height={r * 2} cornerRadius={4} {...common} />;
    }

    if (player.shape === 'triangle') {
      return <RegularPolygon x={0} y={0} sides={3} radius={r + 2} {...common} />;
    }

    if (player.shape === 'diamond') {
      return (
        <Line
          points={[0, -r, r, 0, 0, r, -r, 0]}
          closed
          {...common}
        />
      );
    }

    // fallback
    return <Circle x={0} y={0} radius={r} {...common} />;
  };

  return (
    <Group
      ref={groupRef}
      id={player.id}
      x={player.position.x}
      y={player.position.y}
      opacity={player.opacity ?? 1}
      draggable={!multiDragActive && !isLocked}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onMouseEnter={isLocked ? cursorDefault : cursorGrab}
      onMouseLeave={cursorDefault}
      onDblTap={handleDblClick}
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* SELECTION — bardziej wyraźne, ale nie “oszukuje” bounds */}
      {isSelected && (
        <Circle
          x={0}
          y={0}
          radius={r + 6}
          stroke="#00e5ff"
          strokeWidth={4}
          dash={[10, 6]}
          opacity={0.85}
          fill="transparent"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}

      {/* VISION (behind) */}
      {renderVision()}

      {/* BODY */}
      {renderBodyShape()}

      {/* ARMS (on top of body so circles don't hide them) */}
      {renderArms()}

      {/* NUMBER (on top) — rotates with body, flips for readability */}
      {/* Numer zawodnika jest osobnym mechanizmem — NIE jest podpisem */}
      {player.number != null && (
        <Group rotation={textRotation} listening={false}>
          <Text
            x={-r}
            y={-(player.fontSize ?? 14) / 2}
            width={r * 2}
            height={player.fontSize ?? 14}
            text={String(player.number)}
            fontSize={player.fontSize ?? 14}
            fontFamily="Inter, system-ui, sans-serif"
            fontStyle="bold"
            fill={player.textColor ?? colors.text}
            align="center"
            verticalAlign="middle"
            listening={false}
            perfectDrawEnabled={false}
          />
        </Group>
      )}

      {/* Label below (showLabel === true) — podpis pod zawodnikiem z tłem/pill */}
      {/* Rzeczywisty pomiar szerokości tekstu — brak ucinania */}
      {player.label && player.showLabel === true && (() => {
        const LBL_FONT_SIZE = 11;
        const LBL_PAD_X = 14;
        const LBL_PILL_H = 20;

        // Real text width via offscreen canvas measurement
        const textW = Math.ceil(
          measureTextWidth(player.label, LBL_FONT_SIZE, 'bold', 'Inter, system-ui, sans-serif')
        );
        // Clamp pill width to MAX_LABEL_PILL_WIDTH with ellipsis for very long names
        const textInnerW = Math.min(textW, MAX_LABEL_PILL_WIDTH - LBL_PAD_X * 2);
        const pillW = Math.min(
          Math.max(30, textInnerW + LBL_PAD_X * 2),
          MAX_LABEL_PILL_WIDTH
        );
        const textX = -pillW / 2 + LBL_PAD_X;

        return (
          <Group y={r + 6} listening={false}>
            <Rect
              x={-pillW / 2}
              y={0}
              width={pillW}
              height={LBL_PILL_H}
              cornerRadius={LBL_PILL_H / 2}
              fill="rgba(0,0,0,0.65)"
              shadowColor="rgba(0,0,0,0.4)"
              shadowBlur={4}
              shadowOffset={{ x: 1, y: 1 }}
              shadowEnabled={true}
              listening={false}
              perfectDrawEnabled={false}
            />
            <Text
              x={textX}
              y={3}
              width={textInnerW}
              height={LBL_PILL_H}
              text={player.label}
              fontSize={LBL_FONT_SIZE}
              fontFamily="Inter, system-ui, sans-serif"
              fontStyle="bold"
              fill="#ffffff"
              align="center"
              verticalAlign="middle"
              wrap="none"
              ellipsis={textW > MAX_LABEL_PILL_WIDTH - LBL_PAD_X * 2}
              listening={false}
              perfectDrawEnabled={false}
            />
          </Group>
        );
      })()}

      {/* ROTATION HIT ZONE — annular vision wedge, excludes the body centre so the
          player can still be dragged to move. Active only when selected: grab the
          cone and drag to rotate (no modifier). ALT+drag on the body works too. */}
      {onOrientationPreview && showVision && (
        <Arc
          x={0}
          y={0}
          innerRadius={r * 1.25}
          outerRadius={r * 6}
          angle={60}
          rotation={facingKonva - 30}
          fill="black"
          opacity={0}
          // Always listening: one click on the cone auto-selects AND starts rotating.
          listening={true}
          hitStrokeWidth={0}
          onMouseDown={handleVisionRotateStart}
          onMouseEnter={(e) => {
            const c = e.target.getStage()?.container();
            if (c) c.style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            const c = e.target.getStage()?.container();
            if (c) c.style.cursor = 'default';
          }}
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
};

export const PlayerNode = memo(PlayerNodeComponent, (prevProps, nextProps) => {
  const prevColors = prevProps.teamSettings?.[prevProps.player.team];
  const nextColors = nextProps.teamSettings?.[nextProps.player.team];

  const colorsEqual =
    prevColors?.primaryColor === nextColors?.primaryColor &&
    prevColors?.secondaryColor === nextColors?.secondaryColor &&
    prevColors?.goalkeeperColor === nextColors?.goalkeeperColor;

  const pS = prevProps.playerOrientationSettings as any;
  const nS = nextProps.playerOrientationSettings as any;

  const settingsEqual =
    pS?.enabled === nS?.enabled &&
    pS?.showArms === nS?.showArms &&
    pS?.zoomThreshold === nS?.zoomThreshold &&
    pS?.showVision === nS?.showVision;

  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.position.x === nextProps.player.position.x &&
    prevProps.player.position.y === nextProps.player.position.y &&
    prevProps.player.number === nextProps.player.number &&
    prevProps.player.team === nextProps.player.team &&
    prevProps.player.label === nextProps.player.label &&
    prevProps.player.shape === nextProps.player.shape &&
    prevProps.player.showLabel === nextProps.player.showLabel &&
    prevProps.player.fontSize === nextProps.player.fontSize &&
    prevProps.player.textColor === nextProps.player.textColor &&
    prevProps.player.opacity === nextProps.player.opacity &&
    prevProps.player.radius === nextProps.player.radius &&
    prevProps.player.isGoalkeeper === nextProps.player.isGoalkeeper &&
    prevProps.player.color === nextProps.player.color &&
    prevProps.player.orientation === nextProps.player.orientation &&
    prevProps.player.showVision === nextProps.player.showVision && // Per-player vision toggle
    prevProps.isPrintMode === nextProps.isPrintMode &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.snapEnabled === nextProps.snapEnabled &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.onOrientationPreview === nextProps.onOrientationPreview &&
    prevProps.onOrientationCommit === nextProps.onOrientationCommit &&
    colorsEqual &&
    settingsEqual
  );
});

export default PlayerNode;
