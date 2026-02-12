/**
 * Player node component for the tactical board
 * Performance optimized with React.memo
 */

import React, { useRef, useState, memo } from 'react';
import { Group, Circle, Rect, RegularPolygon, Line, Text, Wedge } from 'react-konva';
import type Konva from 'konva';
import type { PlayerElement, Position, PitchConfig, TeamSettings, PlayerOrientationSettings } from '@tmc/core';
import {
  snapToGrid,
  clampToBounds,
  DEFAULT_TEAM_SETTINGS,
  DEFAULT_PLAYER_ORIENTATION_SETTINGS,
} from '@tmc/core';

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
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);

  const colors = getTeamColors(player.team, teamSettings, player.isGoalkeeper, player.color, isPrintMode);
  const r = player.radius ?? PLAYER_RADIUS;

  const orientationSettings = playerOrientationSettings ?? DEFAULT_PLAYER_ORIENTATION_SETTINGS;

  const hasOrientation = player.orientation !== undefined;
  const orientationEnabled =
    hasOrientation &&
    orientationSettings.enabled === true &&
    zoom >= orientationSettings.zoomThreshold;

  const showArms = orientationEnabled && orientationSettings.showArms === true;

  // Vision requires: orientation enabled + global showVision toggle + per-player showVision
  const showVision = orientationEnabled && orientationSettings.showVision === true && player.showVision !== false;

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
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    const node = e.target;

    const snapped = snapToGrid({ x: node.x(), y: node.y() }, pitchConfig.gridSize);
    const clamped = clampToBounds(snapped, pitchConfig);

    node.x(clamped.x);
    node.y(clamped.y);
    onDragEnd(player.id, clamped);
  };

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

      {/* ARMS (behind body) */}
      {renderArms()}

      {/* BODY */}
      {renderBodyShape()}

      {/* NUMBER (on top) — rotates with body, flips for readability */}
      {((player.showLabel && player.label) || player.number != null) && (
        <Group rotation={textRotation} listening={false}>
          <Text
            x={-r}
            y={-(player.fontSize ?? 14) / 2}
            width={r * 2}
            height={player.fontSize ?? 14}
            text={player.showLabel && player.label ? player.label : String(player.number)}
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

      {/* Label below (never rotated) */}
      {player.label && !player.showLabel && (
        <Text
          x={-30}
          y={r + 4}
          width={60}
          text={player.label}
          fontSize={10}
          fontFamily="Inter, system-ui, sans-serif"
          fill="#ffffff"
          align="center"
          listening={false}
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
    colorsEqual &&
    settingsEqual
  );
});

export default PlayerNode;
