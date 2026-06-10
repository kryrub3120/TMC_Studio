/**
 * Player node component for the tactical board
 * Performance optimized with React.memo
 */

import React, { useRef, useState, memo, useEffect } from 'react';
import { Group, Circle, Rect, RegularPolygon, Line, Text, Wedge } from 'react-konva';
import type Konva from 'konva';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';
import type { PlayerElement, Position, PitchConfig, TeamSettings, PlayerOrientationSettings } from '@tmc/core';
import {
  snapToGrid,
  clampToBounds,
  DEFAULT_TEAM_SETTINGS,
  DEFAULT_PLAYER_ORIENTATION_SETTINGS,
} from '@tmc/core';

/** Normalize angle to 0..360 */
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
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
  teamSettings?: TeamSettings;
  onQuickEditNumber?: (id: string, currentNumber: number) => void;
  isPrintMode?: boolean;
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
  team: 'home' | 'away',
  teamSettings?: TeamSettings,
  isGoalkeeper?: boolean,
  playerColorOverride?: string,
  isPrintMode?: boolean
): TeamColors {
  const settings = teamSettings ?? DEFAULT_TEAM_SETTINGS;
  const teamSetting = settings[team];

  // Priority: GK > player.color > team primary
  let primaryHex = isGoalkeeper
    ? (teamSetting.goalkeeperColor ?? DEFAULT_GK_COLOR)
    : (playerColorOverride ?? teamSetting.primaryColor);

  primaryHex = sanitizeForPrint(primaryHex, isPrintMode ?? false);

  return {
    fill: primaryHex,
    stroke: darkenColor(primaryHex, 20),
    text: teamSetting.secondaryColor,
  };
}

const PLAYER_RADIUS = 18;
const SELECTED_STROKE_WIDTH = 3;
const NORMAL_STROKE_WIDTH = 2;

const PlayerNodeComponent: React.FC<PlayerNodeProps> = ({
  player,
  pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
  onDragStart,
  teamSettings,
  onQuickEditNumber,
  isPrintMode,
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

  // Numer: obraca się z ciałem, ale flip 180 dla czytelności (TYLKO tekst)
  const norm = ((facingDeg % 360) + 360) % 360;
  const flipText = norm > 90 && norm < 270;
  const textRotation = orientationEnabled ? (flipText ? facingKonva + 180 : facingKonva) : 0;

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(player.id, addToSelection);
  };

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onQuickEditNumber?.(player.id, player.number ?? 0);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
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

    const snapped = snapToGrid({ x: node.x(), y: node.y() }, pitchConfig.gridSize);
    const clamped = clampToBounds(snapped, pitchConfig);

    node.x(clamped.x);
    node.y(clamped.y);
    onDragEnd(player.id, clamped);
  };

  // --- ALT+DRAG ROTATION HANDLERS (CORRECTIONS #1-6) ---
  const handleRotationMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle ALT+click (CORRECTION #6)
    if (!e.evt.altKey || !onOrientationPreview) return;
    
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
    const delta = deltaDeg(startPointerAngleRef.current, currentAngleDeg);
    const rawOrientation = startOrientationRef.current + delta;
    
    // Apply snap (ALT+SHIFT = 1°, ALT only = 5°)
    const snapResolution = e.shiftKey ? 1 : 5;
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

  // --- ARMS GEOMETRY (REAL BODY ORIENTATION) ---
  // Ramiona mają “wyjść z barków”, ale NIE rozwalać hitboxa (listening=false).
  // Skrócone o 25%: było 0.40r -> teraz 0.30r
  const renderArms = () => {
    if (!showArms) return null;

    const rad = (facingKonva * Math.PI) / 180;
    const fX = Math.cos(rad);
    const fY = Math.sin(rad);

    const sideRad = rad + Math.PI / 2;
    const sX = Math.cos(sideRad);
    const sY = Math.sin(sideRad);

    // barki lekko “z przodu” korpusu
    const shoulderForward = r * 0.22;
    const shoulderSide = r * 0.52;

    const sx = fX * shoulderForward;
    const sy = fY * shoulderForward;

    const slx = sx - sX * shoulderSide;
    const sly = sy - sY * shoulderSide;

    const srx = sx + sX * shoulderSide;
    const sry = sy + sY * shoulderSide;

    const armLen = r * 0.30; // <- 25% krótsze

    const elx = slx - sX * armLen;
    const ely = sly - sY * armLen;

    const erx = srx + sX * armLen;
    const ery = sry + sY * armLen;

    // “czytelne” ramiona jak w Twoim mocku: ciemny rdzeń + delikatny highlight
    const core = 'rgba(0,0,0,0.70)';
    const highlight = 'rgba(255,255,255,0.18)';

    return (
      <>
        <Line
          points={[slx, sly, elx, ely]}
          stroke={core}
          strokeWidth={6}
          lineCap="round"
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[srx, sry, erx, ery]}
          stroke={core}
          strokeWidth={6}
          lineCap="round"
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[slx, sly, elx, ely]}
          stroke={highlight}
          strokeWidth={3}
          lineCap="round"
          listening={false}
          perfectDrawEnabled={false}
        />
        <Line
          points={[srx, sry, erx, ery]}
          stroke={highlight}
          strokeWidth={3}
          lineCap="round"
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
      draggable={!multiDragActive}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onMouseEnter={cursorGrab}
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
      {/* Dynamiczna szerokość: krótkie i długie nazwiska bez ucinania */}
      {player.label && player.showLabel === true && (() => {
        const LBL_FONT_SIZE = 11;
        const LBL_PAD_X = 14;
        const LBL_PILL_H = 20;
        const approxCharW = LBL_FONT_SIZE * 0.62; // Inter bold ~0.62× fontSize
        const textW = Math.ceil(player.label.length * approxCharW);
        const pillW = Math.max(30, textW + LBL_PAD_X * 2);
        const textX = -pillW / 2 + LBL_PAD_X;
        const textInnerW = pillW - LBL_PAD_X * 2;

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
              height={14}
              text={player.label}
              fontSize={LBL_FONT_SIZE}
              fontFamily="Inter, system-ui, sans-serif"
              fontStyle="bold"
              fill="#ffffff"
              align="center"
              verticalAlign="middle"
              listening={false}
              perfectDrawEnabled={false}
            />
          </Group>
        );
      })()}

      {/* ROTATION HIT ZONE (CORRECTION #4) - simple large circle, on top for event priority */}
      {onOrientationPreview && (
        <Circle
          x={0}
          y={0}
          radius={showVision ? r * 6 : r + 4}
          fill="black"
          opacity={0}
          listening={true}
          hitStrokeWidth={0}
          cursor={isRotatingRef.current ? 'grabbing' : 'crosshair'}
          onMouseDown={handleRotationMouseDown}
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
    prevProps.zoom === nextProps.zoom &&
    prevProps.onOrientationPreview === nextProps.onOrientationPreview &&
    prevProps.onOrientationCommit === nextProps.onOrientationCommit &&
    colorsEqual &&
    settingsEqual
  );
});

export default PlayerNode;
