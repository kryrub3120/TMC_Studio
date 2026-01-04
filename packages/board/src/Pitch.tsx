/**
 * Football pitch rendering component
 */

import React from 'react';
import { Group, Rect, Line, Circle, Arc } from 'react-konva';
import type { PitchConfig } from '@tmc/core';

export interface PitchProps {
  config: PitchConfig;
}

/** Football pitch with standard markings */
export const Pitch: React.FC<PitchProps> = ({ config }) => {
  const { width, height, padding } = config;
  
  // Pitch dimensions (all relative to pitch size)
  const penaltyAreaWidth = width * 0.16;
  const penaltyAreaHeight = height * 0.62;
  const goalAreaWidth = width * 0.055;
  const goalAreaHeight = height * 0.31;
  const centerCircleRadius = height * 0.14;
  const penaltySpotDistance = width * 0.105;
  const cornerRadius = 8;
  const lineWidth = 2;
  const lineColor = 'rgba(255, 255, 255, 0.8)';
  const grassColor = '#2d8a3e';
  const grassStripeColor = '#268735';

  // Calculate positions
  const penaltyAreaY = (height - penaltyAreaHeight) / 2;
  const goalAreaY = (height - goalAreaHeight) / 2;

  return (
    <Group x={padding} y={padding}>
      {/* Grass background with stripes */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={grassColor}
        cornerRadius={4}
      />
      
      {/* Grass stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        i % 2 === 0 ? (
          <Rect
            key={`stripe-${i}`}
            x={(width / 10) * i}
            y={0}
            width={width / 10}
            height={height}
            fill={grassStripeColor}
          />
        ) : null
      ))}

      {/* Pitch outline */}
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

      {/* Center line */}
      <Line
        points={[width / 2, 0, width / 2, height]}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />

      {/* Center circle */}
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

      {/* Left penalty area */}
      <Rect
        x={0}
        y={penaltyAreaY}
        width={penaltyAreaWidth}
        height={penaltyAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
        fill="transparent"
      />

      {/* Left goal area */}
      <Rect
        x={0}
        y={goalAreaY}
        width={goalAreaWidth}
        height={goalAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
        fill="transparent"
      />

      {/* Left penalty spot */}
      <Circle
        x={penaltySpotDistance}
        y={height / 2}
        radius={4}
        fill={lineColor}
      />

      {/* Left penalty arc */}
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

      {/* Right penalty area */}
      <Rect
        x={width - penaltyAreaWidth}
        y={penaltyAreaY}
        width={penaltyAreaWidth}
        height={penaltyAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
        fill="transparent"
      />

      {/* Right goal area */}
      <Rect
        x={width - goalAreaWidth}
        y={goalAreaY}
        width={goalAreaWidth}
        height={goalAreaHeight}
        stroke={lineColor}
        strokeWidth={lineWidth}
        fill="transparent"
      />

      {/* Right penalty spot */}
      <Circle
        x={width - penaltySpotDistance}
        y={height / 2}
        radius={4}
        fill={lineColor}
      />

      {/* Right penalty arc */}
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

      {/* Corner arcs */}
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
    </Group>
  );
};

export default Pitch;
