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
            <Group x={width / 2} y={0} listening={false}>
              {/* Goal frame - U shape */}
              <Line
                points={[
                  -goalMouthWidth / 2, -8,
                  goalMouthWidth / 2, -8,
                  goalMouthWidth / 2, 0,
                  -goalMouthWidth / 2, 0,
                ]}
                stroke={lineColor}
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              {/* Net depth suggestion - diagonal lines */}
              <Line
                points={[-goalMouthWidth / 2, -8, -goalMouthWidth / 2 + 8, -18]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
              <Line
                points={[goalMouthWidth / 2, -8, goalMouthWidth / 2 - 8, -18]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
            </Group>

            {/* BOTTOM goal */}
            <Group x={width / 2} y={height} listening={false}>
              {/* Goal frame - U shape */}
              <Line
                points={[
                  -goalMouthWidth / 2, 8,
                  goalMouthWidth / 2, 8,
                  goalMouthWidth / 2, 0,
                  -goalMouthWidth / 2, 0,
                ]}
                stroke={lineColor}
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              {/* Net depth suggestion - diagonal lines */}
              <Line
                points={[-goalMouthWidth / 2, 8, -goalMouthWidth / 2 + 8, 18]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
              <Line
                points={[goalMouthWidth / 2, 8, goalMouthWidth / 2 - 8, 18]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
            </Group>
          </>
        ) : (
          // Landscape: Goals at LEFT and RIGHT
          <>
            {/* LEFT goal */}
            <Group x={0} y={height / 2} listening={false}>
              {/* Goal frame - U shape */}
              <Line
                points={[
                  -8, goalMouthWidth / 2,
                  -8, -goalMouthWidth / 2,
                  0, -goalMouthWidth / 2,
                  0, goalMouthWidth / 2,
                ]}
                stroke={lineColor}
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              {/* Net depth suggestion - diagonal lines */}
              <Line
                points={[-8, goalMouthWidth / 2, -18, goalMouthWidth / 2 - 8]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
              <Line
                points={[-8, -goalMouthWidth / 2, -18, -goalMouthWidth / 2 + 8]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
            </Group>

            {/* RIGHT goal */}
            <Group x={width} y={height / 2} listening={false}>
              {/* Goal frame - U shape */}
              <Line
                points={[
                  8, goalMouthWidth / 2,
                  8, -goalMouthWidth / 2,
                  0, -goalMouthWidth / 2,
                  0, goalMouthWidth / 2,
                ]}
                stroke={lineColor}
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              {/* Net depth suggestion - diagonal lines */}
              <Line
                points={[8, goalMouthWidth / 2, 18, goalMouthWidth / 2 - 8]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
              <Line
                points={[8, -goalMouthWidth / 2, 18, -goalMouthWidth / 2 + 8]}
                stroke={lineColor}
                strokeWidth={1}
                opacity={0.3}
                listening={false}
              />
            </Group>
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
