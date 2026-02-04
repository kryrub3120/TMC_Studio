/**
 * MannequinShape - PTU-style training dummy
 * 
 * Key traits:
 * - "Equipment" feel: solid torso (fill) + thin leg rods
 * - Clear base plate (grounded)
 * - Designed to rotate around the base center (y=0 pivot)
 * - Scales cleanly for zoom-out / PDF
 * 
 * Contract: PURE VISUAL - no event handlers, all listening={false}
 */
import React from 'react';
import { Group, Line, Rect, Ellipse } from 'react-konva';
import type { EquipmentShapeProps } from './types';

// ─────────────────────────────────────────────────────────────────
// GEOMETRY CONSTANTS (all values for scale=1)
// ─────────────────────────────────────────────────────────────────

const BASE_PLATE_W = 30;
const BASE_PLATE_H = 5;

const TORSO_W_BOTTOM = 26;
const TORSO_W_TOP = 18;
const TORSO_H = 36;

const LEGS_H = 20;
const LEG_ROD_COUNT = 4;
const LEG_ROD_W = 2.2;
const LEG_SPACING = 5.2;

const HEAD_W = 8.5;
const HEAD_H = 10;

const STROKE_OUTER = 2.2;
const STROKE_INNER = 1.6;

const FILL_OPACITY = 0.18;

// ─────────────────────────────────────────────────────────────────
// SINGLE MANNEQUIN RENDERER
// ─────────────────────────────────────────────────────────────────

const renderSingleMannequin = (color: string, scale: number) => {
  const basePlateW = BASE_PLATE_W * scale;
  const basePlateH = BASE_PLATE_H * scale;
  const torsoWBottom = TORSO_W_BOTTOM * scale;
  const torsoWTop = TORSO_W_TOP * scale;
  const torsoH = TORSO_H * scale;
  const legsH = LEGS_H * scale;
  const legSpacing = LEG_SPACING * scale;
  const legRodW = LEG_ROD_W * scale;
  const headW = HEAD_W * scale;
  const headH = HEAD_H * scale;
  const strokeOuter = STROKE_OUTER * scale;
  const strokeInner = STROKE_INNER * scale;

  // Vertical layout (bottom-up from y=0 pivot)
  const baseY = 0;
  const legsTopY = -legsH;
  const torsoBotY = legsTopY;
  const torsoTopY = torsoBotY - torsoH;
  const headCenterY = torsoTopY - 7 * scale;

  return (
    <Group listening={false}>
      {/* Base plate (grounded at y=0 pivot) */}
      <Rect
        x={-basePlateW / 2}
        y={baseY - basePlateH / 2}
        width={basePlateW}
        height={basePlateH}
        fill={color}
        opacity={FILL_OPACITY}
        stroke={color}
        strokeWidth={strokeOuter}
        cornerRadius={2 * scale}
        listening={false}
      />

      {/* Leg rods (thin, equipment-like) */}
      {Array.from({ length: LEG_ROD_COUNT }).map((_, i) => {
        const offset = (i - (LEG_ROD_COUNT - 1) / 2) * legSpacing;
        return (
          <Line
            key={`rod-${i}`}
            points={[offset, baseY - 1 * scale, offset, legsTopY]}
            stroke={color}
            strokeWidth={legRodW}
            opacity={0.9}
            lineCap="round"
            listening={false}
          />
        );
      })}

      {/* Torso: solid fill + outline (trapezoid shape) */}
      <Line
        points={[
          -torsoWTop / 2, torsoTopY,
          torsoWTop / 2, torsoTopY,
          torsoWBottom / 2, torsoBotY,
          -torsoWBottom / 2, torsoBotY,
        ]}
        closed
        fill={color}
        fillOpacity={FILL_OPACITY}
        stroke={color}
        strokeWidth={strokeOuter}
        lineJoin="round"
        listening={false}
      />

      {/* Subtle inner split line (PTU vibe) */}
      <Line
        points={[0, torsoTopY + 3 * scale, 0, torsoBotY - 3 * scale]}
        stroke={color}
        strokeWidth={strokeInner}
        opacity={0.28}
        lineCap="round"
        listening={false}
      />

      {/* Head: ellipse (equipment silhouette) */}
      <Ellipse
        x={0}
        y={headCenterY}
        radiusX={headW / 2}
        radiusY={headH / 2}
        stroke={color}
        strokeWidth={strokeOuter}
        fill={color}
        fillOpacity={FILL_OPACITY}
        listening={false}
      />
    </Group>
  );
};

// ─────────────────────────────────────────────────────────────────
// FLAT (LYING) MANNEQUIN RENDERER
// ─────────────────────────────────────────────────────────────────

const renderFlatMannequin = (color: string, scale: number) => {
  return (
    <Ellipse
      radiusX={25 * scale}
      radiusY={8 * scale}
      fill={color}
      listening={false}
    />
  );
};

// ─────────────────────────────────────────────────────────────────
// WALL_3 VARIANT (3 mannequins in a row)
// ─────────────────────────────────────────────────────────────────

const renderWall3 = (color: string, scale: number) => {
  const gap = 18 * scale;
  const basePlateW = BASE_PLATE_W * scale;

  return (
    <Group listening={false}>
      {/* Left mannequin */}
      <Group x={-gap}>
        {renderSingleMannequin(color, scale)}
      </Group>
      {/* Center mannequin */}
      <Group x={0}>
        {renderSingleMannequin(color, scale)}
      </Group>
      {/* Right mannequin */}
      <Group x={gap}>
        {renderSingleMannequin(color, scale)}
      </Group>

      {/* Shared base plank behind (visual cue it's a wall unit) */}
      <Line
        points={[-gap - basePlateW * 0.6, 0, gap + basePlateW * 0.6, 0]}
        stroke={color}
        strokeWidth={6 * scale}
        opacity={0.12}
        lineCap="round"
        listening={false}
      />
    </Group>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export const MannequinShape: React.FC<EquipmentShapeProps> = ({ color, scale, variant }) => {
  switch (variant) {
    case 'flat':
      return renderFlatMannequin(color, scale);
    
    case 'wall_3':
      return renderWall3(color, scale);
    
    case 'standing':
    default:
      return renderSingleMannequin(color, scale);
  }
};
