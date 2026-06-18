/**
 * Football pitch rendering component
 * Supports both landscape and portrait orientations
 * Supports line visibility controls and pitch views
 */

import React from 'react';
import { Group, Rect, Line, Circle, Arc } from 'react-konva';
import type { PitchConfig, PitchSettings, PitchLineSettings } from '@tmc/core';
import {
  DEFAULT_PITCH_SETTINGS,
  DEFAULT_LINE_SETTINGS,
  HALF_BOARD_DEPTH_M,
  PENALTY_BOARD_DEPTH_M,
} from '@tmc/core';

export interface PitchProps {
  config: PitchConfig;
  pitchSettings?: PitchSettings;
  gridVisible?: boolean;
}

/** Helper: Render a clean V4-minimal goal overlay */
function renderGoalOverlay(params: {
  orientation: 'landscape' | 'portrait';
  side: 'left' | 'right' | 'top' | 'bottom';
  centerX: number;
  centerY: number;
  goalMouthWidth: number;
  lineColor: string;
}): JSX.Element {
  const { orientation, side, centerX, centerY, goalMouthWidth, lineColor } = params;
  
  // Geometry constants
  const depth = Math.max(10, goalMouthWidth * 0.15);
  const postInset = 8; // Small inset from pitch boundary
  
  // Perspective offsets for depth
  let depthX = 0;
  let depthY = 0;
  let frontY = 0;
  let frontX = 0;
  
  if (orientation === 'landscape') {
    // Goals at LEFT/RIGHT
    if (side === 'left') {
      frontX = -postInset;
      depthX = -depth;
      depthY = -depth * 0.2; // Slight Y offset for perspective
    } else { // right
      frontX = postInset;
      depthX = depth;
      depthY = -depth * 0.2;
    }
  } else {
    // Goals at TOP/BOTTOM (portrait)
    if (side === 'top') {
      frontY = -postInset;
      depthY = -depth;
      depthX = -depth * 0.2; // Slight X offset for perspective
    } else { // bottom
      frontY = postInset;
      depthY = depth;
      depthX = -depth * 0.2;
    }
  }
  
  const halfWidth = goalMouthWidth / 2;
  
  return (
    <Group x={centerX} y={centerY} listening={false}>
      {orientation === 'landscape' ? (
        <>
          {/* Front U-frame: Left post */}
          <Line
            points={[frontX, -halfWidth, frontX, halfWidth]}
            stroke={lineColor}
            strokeWidth={3}
            lineCap="round"
            listening={false}
          />
          {/* Front U-frame: Crossbar */}
          <Line
            points={[frontX, -halfWidth, 0, -halfWidth]}
            stroke={lineColor}
            strokeWidth={3}
            lineCap="round"
            listening={false}
          />
          {/* Front U-frame: Right post */}
          <Line
            points={[0, -halfWidth, 0, halfWidth]}
            stroke={lineColor}
            strokeWidth={3}
            lineCap="round"
            listening={false}
          />
          
          {/* Back top bar (depth) */}
          <Line
            points={[
              frontX + depthX, -halfWidth + depthY,
              frontX + depthX, halfWidth + depthY
            ]}
            stroke={lineColor}
            strokeWidth={1.5}
            listening={false}
          />
          
          {/* Connectors: Front corners to back corners */}
          <Line
            points={[
              frontX, -halfWidth,
              frontX + depthX, -halfWidth + depthY
            ]}
            stroke={lineColor}
            strokeWidth={1.5}
            listening={false}
          />
          <Line
            points={[
              frontX, halfWidth,
              frontX + depthX, halfWidth + depthY
            ]}
            stroke={lineColor}
            strokeWidth={1.5}
            listening={false}
          />
          
          {/* Net lines: 2 diagonals for subtle depth */}
          <Line
            points={[
              frontX, -halfWidth,
              frontX + depthX * 0.6, 0
            ]}
            stroke={lineColor}
            strokeWidth={1}
            opacity={0.25}
            listening={false}
          />
          <Line
            points={[
              frontX, halfWidth,
              frontX + depthX * 0.6, 0
            ]}
            stroke={lineColor}
            strokeWidth={1}
            opacity={0.25}
            listening={false}
          />
          
          {/* Ground base line (subtle) */}
          <Line
            points={[0, halfWidth, frontX + depthX, halfWidth + depthY]}
            stroke={lineColor}
            strokeWidth={1}
            opacity={0.2}
            listening={false}
          />
        </>
      ) : (
        <>
          {/* Portrait: Front U-frame - Crossbar */}
          <Line
            points={[-halfWidth, frontY, halfWidth, frontY]}
            stroke={lineColor}
            strokeWidth={3}
            lineCap="round"
            listening={false}
          />
          {/* Portrait: Front U-frame - Left post */}
          <Line
            points={[-halfWidth, frontY, -halfWidth, 0]}
            stroke={lineColor}
            strokeWidth={3}
            lineCap="round"
            listening={false}
          />
          {/* Portrait: Front U-frame - Right post */}
          <Line
            points={[halfWidth, frontY, halfWidth, 0]}
            stroke={lineColor}
            strokeWidth={3}
            lineCap="round"
            listening={false}
          />
          
          {/* Back top bar */}
          <Line
            points={[
              -halfWidth + depthX, frontY + depthY,
              halfWidth + depthX, frontY + depthY
            ]}
            stroke={lineColor}
            strokeWidth={1.5}
            listening={false}
          />
          
          {/* Connectors */}
          <Line
            points={[
              -halfWidth, frontY,
              -halfWidth + depthX, frontY + depthY
            ]}
            stroke={lineColor}
            strokeWidth={1.5}
            listening={false}
          />
          <Line
            points={[
              halfWidth, frontY,
              halfWidth + depthX, frontY + depthY
            ]}
            stroke={lineColor}
            strokeWidth={1.5}
            listening={false}
          />
          
          {/* Net lines: 2 diagonals */}
          <Line
            points={[
              -halfWidth, frontY,
              0, frontY + depthY * 0.6
            ]}
            stroke={lineColor}
            strokeWidth={1}
            opacity={0.25}
            listening={false}
          />
          <Line
            points={[
              halfWidth, frontY,
              0, frontY + depthY * 0.6
            ]}
            stroke={lineColor}
            strokeWidth={1}
            opacity={0.25}
            listening={false}
          />
          
          {/* Ground base line */}
          <Line
            points={[-halfWidth, 0, -halfWidth + depthX, frontY + depthY]}
            stroke={lineColor}
            strokeWidth={1}
            opacity={0.2}
            listening={false}
          />
        </>
      )}
    </Group>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Region views (half pitch / penalty area) — flat tactical crops.
// Rendered inside the SAME fixed box as the full pitch, so the canvas
// coordinate system, padding and orientation transforms are untouched.
// ─────────────────────────────────────────────────────────────────────────

type RegionKind = 'half' | 'penalty-area';

/** Real-world proportions (metres) used to lay out a region view.
 *  fieldW = lateral (goal-width direction), fieldD = goal-line -> cut edge.
 *
 *  Half boards continue past the halfway line so the full centre circle is
 *  visible. Penalty boards keep the full pitch width and extend toward midfield
 *  without drawing the centre circle.
 */
function getRegionFieldDims(kind: RegionKind): { fieldW: number; fieldD: number } {
  if (kind === 'penalty-area') return { fieldW: 68, fieldD: PENALTY_BOARD_DEPTH_M };
  return { fieldW: 68, fieldD: HALF_BOARD_DEPTH_M };
}

// Standard pitch markings in metres (shared by both projections)
const M = {
  penaltyDepth: 16.5,
  penaltyHalfW: 20.16,
  goalDepth: 5.5,
  goalHalfW: 9.16,
  spotDist: 11,
  arcR: 9.15,
  circleR: 9.15,
  goalMouthHalfW: 3.66,
  goalNetDepth: 2,
  cornerR: 1,
  halfLine: 52.5,
};

function getRegionFrame(kind: RegionKind, width: number, height: number, isPortrait: boolean) {
  const { fieldW, fieldD } = getRegionFieldDims(kind);
  const sidePad = width * 0.035;
  const topPad = height * 0.055;
  const bottomPad = height * 0.055;
  const scale = isPortrait
    ? Math.min((width - sidePad * 2) / fieldW, (height - topPad - bottomPad) / fieldD)
    : Math.min((width - sidePad * 2) / fieldD, (height - topPad - bottomPad) / fieldW);
  const fieldPxW = fieldW * scale;
  const fieldPxD = fieldD * scale;
  const left = (width - fieldPxD) / 2;

  return {
    isPortrait,
    fieldW,
    fieldD,
    scale,
    lateralCenter: isPortrait ? width / 2 : height / 2,
    goalLine: isPortrait ? topPad : left + fieldPxD,
    width: fieldPxW,
    depth: fieldPxD,
  };
}

function renderFlatGoal(params: {
  side: 'top' | 'right';
  center: number;
  goalLine: number;
  goalMouthWidth: number;
  goalDepth: number;
  lineColor: string;
}): JSX.Element {
  const { side, center, goalLine, goalMouthWidth, goalDepth, lineColor } = params;
  const half = goalMouthWidth / 2;
  const framePoints = side === 'top'
    ? [
        center - half, goalLine,
        center - half, goalLine - goalDepth,
        center + half, goalLine - goalDepth,
        center + half, goalLine,
      ]
    : [
        goalLine, center - half,
        goalLine + goalDepth, center - half,
        goalLine + goalDepth, center + half,
        goalLine, center + half,
      ];
  const mouthPoints = side === 'top'
    ? [center - half, goalLine, center + half, goalLine]
    : [goalLine, center - half, goalLine, center + half];

  return (
    <Group listening={false}>
      <Line
        points={framePoints}
        stroke={lineColor}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
      <Line
        points={mouthPoints}
        stroke={lineColor}
        strokeWidth={1}
        opacity={0.45}
        listening={false}
      />
    </Group>
  );
}

/** FLAT (2D top-down) region view.
 *  Keeps half/penalty presets visually consistent with ProTrainUp-style boards
 *  while respecting the app orientation: goal at top in portrait, right in landscape. */
function renderRegionFlat(params: {
  kind: RegionKind;
  isPortrait: boolean;
  width: number;
  height: number;
  lines: PitchLineSettings;
  lineColor: string;
}): JSX.Element {
  const { kind, isPortrait, width, height, lines, lineColor } = params;
  const frame = getRegionFrame(kind, width, height, isPortrait);
  const lineWidth = 2;
  const point = (lateralM: number, depthM: number) => (
    isPortrait
      ? { x: frame.lateralCenter + lateralM * frame.scale, y: frame.goalLine + depthM * frame.scale }
      : { x: frame.goalLine - depthM * frame.scale, y: frame.lateralCenter + lateralM * frame.scale }
  );
  const pts = (points: Array<[number, number]>) => points.flatMap(([lat, dep]) => {
    const p = point(lat, dep);
    return [p.x, p.y];
  });
  const segment = (from: [number, number], to: [number, number], key: string) => (
    <Line
      key={key}
      points={pts([from, to])}
      stroke={lineColor}
      strokeWidth={lineWidth}
      listening={false}
    />
  );
  const ring = (cd: number, cl: number, rm: number, a0: number, a1: number, key: string) => {
    const steps = 72;
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = a0 + (a1 - a0) * (i / steps);
      const p = point(cl + rm * Math.sin(t), cd + rm * Math.cos(t));
      out.push(p.x, p.y);
    }
    return <Line key={key} points={out} stroke={lineColor} strokeWidth={lineWidth} listening={false} />;
  };
  const cornerArc = (corner: 'left' | 'right', key: string) => {
    const steps = 18;
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = (Math.PI / 2) * (i / steps);
      const lateral = corner === 'left'
        ? -frame.fieldW / 2 + M.cornerR * Math.sin(a)
        : frame.fieldW / 2 - M.cornerR * Math.sin(a);
      const depth = M.cornerR * Math.cos(a);
      const p = point(lateral, depth);
      out.push(p.x, p.y);
    }
    return <Line key={key} points={out} stroke={lineColor} strokeWidth={lineWidth} listening={false} />;
  };

  return (
    <Group listening={false}>
      {lines.showOutline && (
        <>
          {segment([-frame.fieldW / 2, 0], [frame.fieldW / 2, 0], 'flat-goal-line')}
          {segment([-frame.fieldW / 2, 0], [-frame.fieldW / 2, frame.fieldD], 'flat-touchline-l')}
          {segment([frame.fieldW / 2, 0], [frame.fieldW / 2, frame.fieldD], 'flat-touchline-r')}
        </>
      )}

      {kind === 'half' && lines.showCenterLine && (
        <>
          {segment([-frame.fieldW / 2, M.halfLine], [frame.fieldW / 2, M.halfLine], 'flat-half-line')}
        </>
      )}

      {lines.showPenaltyAreas && (
        <Line
          points={pts([
            [-M.penaltyHalfW, 0],
            [M.penaltyHalfW, 0],
            [M.penaltyHalfW, M.penaltyDepth],
            [-M.penaltyHalfW, M.penaltyDepth],
          ])}
          closed
          stroke={lineColor}
          strokeWidth={lineWidth}
          listening={false}
        />
      )}

      {lines.showGoalAreas && (
        <Line
          points={pts([
            [-M.goalHalfW, 0],
            [M.goalHalfW, 0],
            [M.goalHalfW, M.goalDepth],
            [-M.goalHalfW, M.goalDepth],
          ])}
          closed
          stroke={lineColor}
          strokeWidth={lineWidth}
          listening={false}
        />
      )}

      {lines.showPenaltySpots && (
        <>
          {(() => {
            const p = point(0, M.spotDist);
            return <Circle x={p.x} y={p.y} radius={3.5} fill={lineColor} listening={false} />;
          })()}
          {ring(
            M.spotDist,
            0,
            M.arcR,
            -Math.acos((M.penaltyDepth - M.spotDist) / M.arcR),
            Math.acos((M.penaltyDepth - M.spotDist) / M.arcR),
            'flat-pa-arc',
          )}
        </>
      )}

      {kind === 'half' && lines.showCenterCircle && (
        <>
          {ring(M.halfLine, 0, M.circleR, 0, Math.PI * 2, 'flat-centre-circle')}
          {(() => {
            const c = point(0, M.halfLine);
            return <Circle x={c.x} y={c.y} radius={3.5} fill={lineColor} listening={false} />;
          })()}
        </>
      )}

      {lines.showCornerArcs && (
        <>
          {cornerArc('left', 'flat-corner-l')}
          {cornerArc('right', 'flat-corner-r')}
        </>
      )}

      {lines.showGoals && renderFlatGoal({
        side: isPortrait ? 'top' : 'right',
        center: frame.lateralCenter,
        goalLine: frame.goalLine,
        goalMouthWidth: M.goalMouthHalfW * 2 * frame.scale,
        goalDepth: M.goalNetDepth * frame.scale,
        lineColor,
      })}
    </Group>
  );
}

/** Renders the complete, correctly-proportioned full-pitch markings.
 *  Shared by the full board and (via clipping) by the region views. */
function renderPitchMarkings(
  width: number,
  height: number,
  isPortrait: boolean,
  isPlainView: boolean,
  lines: PitchLineSettings,
  lineColor: string,
  opts: { isHalfPitch?: boolean; showLeftGoalOnly?: boolean; showRightGoalOnly?: boolean } = {},
): JSX.Element {
  const lineWidth = 2;
  const cornerRadius = 8;
  const isHalfPitch = opts.isHalfPitch ?? false;
  const showLeftGoalOnly = opts.showLeftGoalOnly ?? false;
  const showRightGoalOnly = opts.showRightGoalOnly ?? false;

  const longDim = isPortrait ? height : width;
  const shortDim = isPortrait ? width : height;
  
  // Pitch dimensions relative to the long dimension
  const penaltyAreaDepth = longDim * 0.16;      // How far into pitch
  const penaltyAreaWidth = shortDim * 0.62;     // Width across pitch
  const goalAreaDepth = longDim * 0.055;
  const goalAreaWidth = shortDim * 0.31;
  const centerCircleRadius = shortDim * 0.14;
  const penaltySpotDistance = longDim * 0.105;

  // Calculate positions for penalty/goal areas (centered on short dimension)
  const penaltyAreaOffset = (shortDim - penaltyAreaWidth) / 2;
  const goalAreaOffset = (shortDim - goalAreaWidth) / 2;
  
  // Goal mouth width (standard ~7.32m scaled to pitch)
  const goalMouthWidth = shortDim * 0.12;

  return (
    <>
      {/* Pitch outline */}
      {!isPlainView && lines.showOutline && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          stroke={lineColor}
          strokeWidth={lineWidth}
          fill="transparent"
          cornerRadius={4}
        />
      )}

      {/* Center line */}
      {!isPlainView && lines.showCenterLine && (
        isPortrait ? (
          // Portrait: HORIZONTAL center line
          <Line
            points={[0, height / 2, width, height / 2]}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />
        ) : (
          // Landscape: VERTICAL center line
          <Line
            points={[width / 2, 0, width / 2, height]}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />
        )
      )}

      {/* Center circle */}
      {!isPlainView && lines.showCenterCircle && (
        <>
          <Circle
            x={width / 2}
            y={height / 2}
            radius={centerCircleRadius}
            stroke={lineColor}
            strokeWidth={lineWidth}
            fill="transparent"
          />
          {/* Center spot */}
          <Circle
            x={width / 2}
            y={height / 2}
            radius={4}
            fill={lineColor}
          />
        </>
      )}

      {isPortrait ? (
        // ========== PORTRAIT MODE ==========
        // Goals at TOP and BOTTOM
        <>
          {/* TOP penalty area */}
          {!isPlainView && lines.showPenaltyAreas && (
            <Rect
              x={penaltyAreaOffset}
              y={0}
              width={penaltyAreaWidth}
              height={penaltyAreaDepth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* TOP goal area */}
          {!isPlainView && lines.showGoalAreas && (
            <Rect
              x={goalAreaOffset}
              y={0}
              width={goalAreaWidth}
              height={goalAreaDepth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* TOP penalty spot & arc */}
          {!isPlainView && lines.showPenaltySpots && (
            <>
              <Circle
                x={width / 2}
                y={penaltySpotDistance}
                radius={4}
                fill={lineColor}
              />
              <Arc
                x={width / 2}
                y={penaltySpotDistance}
                innerRadius={centerCircleRadius}
                outerRadius={centerCircleRadius}
                angle={106}
                rotation={37}
                stroke={lineColor}
                strokeWidth={lineWidth}
                fill="transparent"
              />
            </>
          )}

          {/* BOTTOM penalty area */}
          {!isPlainView && lines.showPenaltyAreas && (
            <Rect
              x={penaltyAreaOffset}
              y={height - penaltyAreaDepth}
              width={penaltyAreaWidth}
              height={penaltyAreaDepth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* BOTTOM goal area */}
          {!isPlainView && lines.showGoalAreas && (
            <Rect
              x={goalAreaOffset}
              y={height - goalAreaDepth}
              width={goalAreaWidth}
              height={goalAreaDepth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* BOTTOM penalty spot & arc */}
          {!isPlainView && lines.showPenaltySpots && (
            <>
              <Circle
                x={width / 2}
                y={height - penaltySpotDistance}
                radius={4}
                fill={lineColor}
              />
              <Arc
                x={width / 2}
                y={height - penaltySpotDistance}
                innerRadius={centerCircleRadius}
                outerRadius={centerCircleRadius}
                angle={106}
                rotation={217}
                stroke={lineColor}
                strokeWidth={lineWidth}
                fill="transparent"
              />
            </>
          )}
        </>
      ) : (
        // ========== LANDSCAPE MODE ==========
        // Goals at LEFT and RIGHT
        <>
          {/* LEFT penalty area */}
          {!isPlainView && lines.showPenaltyAreas && (
            <Rect
              x={0}
              y={penaltyAreaOffset}
              width={penaltyAreaDepth}
              height={penaltyAreaWidth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* LEFT goal area */}
          {!isPlainView && lines.showGoalAreas && (
            <Rect
              x={0}
              y={goalAreaOffset}
              width={goalAreaDepth}
              height={goalAreaWidth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* LEFT penalty spot & arc */}
          {!isPlainView && lines.showPenaltySpots && (
            <>
              <Circle
                x={penaltySpotDistance}
                y={height / 2}
                radius={4}
                fill={lineColor}
              />
              <Arc
                x={penaltySpotDistance}
                y={height / 2}
                innerRadius={centerCircleRadius}
                outerRadius={centerCircleRadius}
                angle={106}
                rotation={-53}
                stroke={lineColor}
                strokeWidth={lineWidth}
                fill="transparent"
              />
            </>
          )}

          {/* RIGHT penalty area */}
          {!isPlainView && lines.showPenaltyAreas && (
            <Rect
              x={width - penaltyAreaDepth}
              y={penaltyAreaOffset}
              width={penaltyAreaDepth}
              height={penaltyAreaWidth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* RIGHT goal area */}
          {!isPlainView && lines.showGoalAreas && (
            <Rect
              x={width - goalAreaDepth}
              y={goalAreaOffset}
              width={goalAreaDepth}
              height={goalAreaWidth}
              stroke={lineColor}
              strokeWidth={lineWidth}
              fill="transparent"
            />
          )}

          {/* RIGHT penalty spot & arc */}
          {!isPlainView && lines.showPenaltySpots && (
            <>
              <Circle
                x={width - penaltySpotDistance}
                y={height / 2}
                radius={4}
                fill={lineColor}
              />
              <Arc
                x={width - penaltySpotDistance}
                y={height / 2}
                innerRadius={centerCircleRadius}
                outerRadius={centerCircleRadius}
                angle={106}
                rotation={127}
                stroke={lineColor}
                strokeWidth={lineWidth}
                fill="transparent"
              />
            </>
          )}
        </>
      )}

      {/* Corner arcs - same for both orientations */}
      {!isPlainView && lines.showCornerArcs && (
        <>
          <Arc
            x={0}
            y={0}
            innerRadius={cornerRadius}
            outerRadius={cornerRadius}
            angle={90}
            rotation={0}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />
          <Arc
            x={width}
            y={0}
            innerRadius={cornerRadius}
            outerRadius={cornerRadius}
            angle={90}
            rotation={90}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />
          <Arc
            x={width}
            y={height}
            innerRadius={cornerRadius}
            outerRadius={cornerRadius}
            angle={90}
            rotation={180}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />
          <Arc
            x={0}
            y={height}
            innerRadius={cornerRadius}
            outerRadius={cornerRadius}
            angle={90}
            rotation={270}
            stroke={lineColor}
            strokeWidth={lineWidth}
          />
        </>
      )}

      {/* === GOALS OVERLAY === */}
      {!isPlainView && lines.showGoals && (
        isPortrait ? (
          // Portrait: Goals at TOP and BOTTOM
          <>
            {/* TOP goal */}
            {!isHalfPitch && renderGoalOverlay({
              orientation: 'portrait',
              side: 'top',
              centerX: width / 2,
              centerY: 0,
              goalMouthWidth,
              lineColor,
            })}

            {/* BOTTOM goal */}
            {!isHalfPitch && renderGoalOverlay({
              orientation: 'portrait',
              side: 'bottom',
              centerX: width / 2,
              centerY: height,
              goalMouthWidth,
              lineColor,
            })}
          </>
        ) : (
          // Landscape: Goals at LEFT and RIGHT
          <>
            {/* LEFT goal */}
            {(!isHalfPitch || showLeftGoalOnly) && renderGoalOverlay({
              orientation: 'landscape',
              side: 'left',
              centerX: 0,
              centerY: height / 2,
              goalMouthWidth,
              lineColor,
            })}

            {/* RIGHT goal */}
            {(!isHalfPitch || showRightGoalOnly) && renderGoalOverlay({
              orientation: 'landscape',
              side: 'right',
              centerX: width,
              centerY: height / 2,
              goalMouthWidth,
              lineColor,
            })}
          </>
        )
      )}

    </>
  );
}

/** Football pitch with standard markings */
export const Pitch: React.FC<PitchProps> = ({ config, pitchSettings, gridVisible = false }) => {
  const { width, height, padding, gridSize } = config;

  // Use provided settings or defaults
  const settings = pitchSettings ?? DEFAULT_PITCH_SETTINGS;
  const isPortrait = settings.orientation === 'portrait';

  // Line visibility settings (with fallback for backward compatibility)
  const lines = settings.lines ?? DEFAULT_LINE_SETTINGS;

  // Check if view is 'plain' (no lines at all)
  const isPlainView = settings.view === 'plain';

  // Cropped tactical region views (half pitch / penalty area)
  const regionKind: RegionKind | null =
    settings.view === 'half' ? 'half' : settings.view === 'penalty-area' ? 'penalty-area' : null;

  // Detect half-pitch views (reuse existing half-pitch signal)
  const isHalfPitch = settings.view === 'half-left' || settings.view === 'half-right';
  const showLeftGoalOnly = settings.view === 'half-left';
  const showRightGoalOnly = settings.view === 'half-right';

  // Use theme colors
  const lineColor = settings.lineColor;
  const grassColor = settings.primaryColor;
  const grassStripeColor = settings.stripeColor;
  const showStripes = settings.showStripes;

  // For portrait: goals are at TOP and BOTTOM
  // For landscape: goals are at LEFT and RIGHT

  // The "long" dimension is where the goal area extends
  // In landscape: width is long, penalty areas on left/right
  // In portrait: height is long, penalty areas on top/bottom


  return (
    <Group x={padding} y={padding}>
      {/* Grass background */}
      <Rect
        name="pitch-background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={grassColor}
        cornerRadius={4}
      />

      {/* Grass stripes */}
      {showStripes && Array.from({ length: 10 }).map((_, i) => {
        if (i % 2 !== 0) return null;

        if (isPortrait) {
          // Portrait: HORIZONTAL stripes
          return (
            <Rect
              key={`stripe-${i}`}
              x={0}
              y={(height / 10) * i}
              width={width}
              height={height / 10}
              fill={grassStripeColor}
            />
          );
        } else {
          // Landscape: VERTICAL stripes
          return (
            <Rect
              key={`stripe-${i}`}
              x={(width / 10) * i}
              y={0}
              width={width / 10}
              height={height}
              fill={grassStripeColor}
            />
          );
        }
      })}

      {/* Full-pitch markings (hidden for region views) */}
      {!regionKind && renderPitchMarkings(width, height, isPortrait, isPlainView, lines, lineColor, { isHalfPitch, showLeftGoalOnly, showRightGoalOnly })}

      {/* Region views: half pitch / penalty area */}
      {regionKind && (
        renderRegionFlat({
          kind: regionKind,
          isPortrait,
          width,
          height,
          lines,
          lineColor,
        })
      )}

      {/* Snap Grid Overlay */}
      {gridVisible && (
        <Group listening={false} opacity={0.3}>
          {/* Vertical grid lines */}
          {Array.from({ length: Math.floor(width / gridSize) + 1 }).map((_, i) => (
            <Line
              key={`grid-v-${i}`}
              points={[i * gridSize, 0, i * gridSize, height]}
              stroke="#ffffff"
              strokeWidth={0.5}
              dash={[2, 4]}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: Math.floor(height / gridSize) + 1 }).map((_, i) => (
            <Line
              key={`grid-h-${i}`}
              points={[0, i * gridSize, width, i * gridSize]}
              stroke="#ffffff"
              strokeWidth={0.5}
              dash={[2, 4]}
            />
          ))}
        </Group>
      )}
    </Group>
  );
};

export default Pitch;
