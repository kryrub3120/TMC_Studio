/**
 * GoalShape - V4 top-forward perspective (premium wireframe)
 */
import React from 'react';
import { Group, Line } from 'react-konva';
import type { EquipmentShapeProps } from './types';

export const GoalShape: React.FC<EquipmentShapeProps> = ({ color, scale, variant }) => {
  // Base dimensions in px (then scaled)
  const baseW = variant === 'mini' ? 54 : 110;
  const baseH = variant === 'mini' ? 30 : 44;
  const baseD = variant === 'mini' ? 16 : 26;

  const width = baseW * scale;
  const height = baseH * scale;
  const depth = baseD * scale;

  // Perspective offsets
  const dx = Math.round(depth * 0.3);
  const dy = -Math.round(depth * 0.6);

  // Mesh density (perf adaptive)
  const meshCols = scale < 0.9 ? 8 : 12;
  const meshRows = scale < 0.9 ? 4 : 5;

  const xL = -width / 2;
  const xR = width / 2;
  const yB = height / 2;
  const yT = -height / 2;

  // Back frame (slightly narrower)
  const bxL = xL + dx;
  const bxR = xR + dx;
  const byB = yB + dy;
  const byT = yT + dy;

  const backWidthScale = variant === 'mini' ? 0.85 : 0.95;
  const backCenter = (bxL + bxR) / 2;
  const bxL2 = backCenter - (width * backWidthScale) / 2;
  const bxR2 = backCenter + (width * backWidthScale) / 2;

  const frontStroke = variant === 'mini' ? 3 : 4;
  const backStroke = Math.max(1, 1.5 * scale);
  const meshStroke = Math.max(0.5, 0.6 * scale);

  // Front frame MUST be U-shape (no bottom bar)
  const frontU = [
    xL, yB,
    xL, yT,
    xR, yT,
    xR, yB,
  ];

  return (
    <Group listening={false}>
      {/* 1) Ground/back base (subtle) */}
      <Line
        points={[xL, yB, bxL2, byB, bxR2, byB, xR, yB]}
        stroke={color}
        strokeWidth={backStroke}
        opacity={0.25}
        lineJoin="round"
        lineCap="round"
        listening={false}
      />

      {/* 2) Rear mesh panel (subtle grid) */}
      <Group opacity={0.18} listening={false}>
        {/* vertical lines */}
        {Array.from({ length: meshCols + 1 }).map((_, i) => {
          const t = i / meshCols;
          const x = bxL2 + (bxR2 - bxL2) * t;
          return (
            <Line
              key={`rv-${i}`}
              points={[x, byT, x, byB]}
              stroke={color}
              strokeWidth={meshStroke}
              listening={false}
            />
          );
        })}
        {/* horizontal lines */}
        {Array.from({ length: meshRows + 1 }).map((_, i) => {
          const t = i / meshRows;
          const y = byT + (byB - byT) * t;
          return (
            <Line
              key={`rh-${i}`}
              points={[bxL2, y, bxR2, y]}
              stroke={color}
              strokeWidth={meshStroke}
              listening={false}
            />
          );
        })}
      </Group>

      {/* 3) Side net "panels" (very subtle fill) */}
      <Group opacity={0.12} listening={false}>
        <Line
          points={[xL, yT, bxL2, byT, bxL2, byB, xL, yB]}
          closed
          stroke={color}
          strokeWidth={meshStroke}
          fill={color}
          opacity={0.06}
          listening={false}
        />
        <Line
          points={[xR, yT, bxR2, byT, bxR2, byB, xR, yB]}
          closed
          stroke={color}
          strokeWidth={meshStroke}
          fill={color}
          opacity={0.06}
          listening={false}
        />
      </Group>

      {/* 4) Support connectors (top only) */}
      <Line points={[xL, yT, bxL2, byT]} stroke={color} strokeWidth={backStroke} opacity={0.55} listening={false} />
      <Line points={[xR, yT, bxR2, byT]} stroke={color} strokeWidth={backStroke} opacity={0.55} listening={false} />

      {/* 5) Back top bar */}
      <Line points={[bxL2, byT, bxR2, byT]} stroke={color} strokeWidth={backStroke} opacity={0.65} listening={false} />

      {/* 6) Front U-frame (dominant) */}
      <Line
        points={frontU}
        stroke={color}
        strokeWidth={frontStroke}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    </Group>
  );
};
