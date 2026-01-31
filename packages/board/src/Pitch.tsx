/**
 * Football pitch rendering component
 * Supports both landscape and portrait orientations
 * Supports line visibility controls and pitch views
 */

import React from 'react';
import { Group, Rect, Line, Circle, Arc } from 'react-konva';
import type { PitchConfig, PitchSettings } from '@tmc/core';
import { DEFAULT_PITCH_SETTINGS, DEFAULT_LINE_SETTINGS } from '@tmc/core';

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
  
  // Detect half-pitch views (reuse existing half-pitch signal)
  const isHalfPitch = settings.view === 'half-left' || settings.view === 'half-right';
  const showLeftGoalOnly = settings.view === 'half-left';
  const showRightGoalOnly = settings.view === 'half-right';
  
  // Use theme colors
  const lineColor = settings.lineColor;
  const grassColor = settings.primaryColor;
  const grassStripeColor = settings.stripeColor;
  const showStripes = settings.showStripes;
  const lineWidth = 2;
  const cornerRadius = 8;

  // For portrait: goals are at TOP and BOTTOM
  // For landscape: goals are at LEFT and RIGHT
  
  // The "long" dimension is where the goal area extends
  // In landscape: width is long, penalty areas on left/right
  // In portrait: height is long, penalty areas on top/bottom
  
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
