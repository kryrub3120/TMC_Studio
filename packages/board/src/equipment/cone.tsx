/**
 * ConeShape — training cones.
 *
 * Three variants (all share a grounded base plate, so they never read as a
 * player/arrow the way the old bare triangle did):
 *   - 'flat'     → low disc / marker dome (fastest to place, reads from any zoom)
 *   - 'standard' → classic training cone, base plate + 1 reflective stripe
 *   - 'tall'     → taller slalom cone, base plate + 2 reflective stripes
 *
 * Pivot sits at the base centre (y = 0) so cones rotate around where they
 * touch the pitch. Body + base are filled with `color` (recolourable to any
 * colour); stripes/outline are white. A small darken() gives subtle depth
 * while staying recolour-safe — no hard-coded shades.
 *
 * Contract: PURE VISUAL — no event handlers, all listening={false}.
 */
import React from 'react';
import { Group, Line, Ellipse } from 'react-konva';
import type { EquipmentShapeProps } from './types';

// ── color helper ────────────────────────────────────────────────────
/** Darken a #rgb / #rrggbb hex by `amount` (0..1). Falls back to input. */
function darken(color: string, amount: number): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const f = 1 - Math.max(0, Math.min(1, amount));
  const r = Math.round(parseInt(hex.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(hex.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(hex.slice(4, 6), 16) * f);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// ── geometry helpers ────────────────────────────────────────────────
/** Half-width of a tapered cone body at height `y` (linear interp). */
function halfWidthAt(y: number, bottomY: number, apexY: number, bottomHalf: number, topHalf: number): number {
  const t = (y - bottomY) / (apexY - bottomY); // 0 at base, 1 at apex
  return bottomHalf + (topHalf - bottomHalf) * t;
}

/** Build the closed point list for one reflective stripe band on the body. */
function stripePoints(
  yTop: number,
  yBot: number,
  bottomY: number,
  apexY: number,
  bottomHalf: number,
  topHalf: number,
  s: number
): number[] {
  const wTop = halfWidthAt(yTop, bottomY, apexY, bottomHalf, topHalf);
  const wBot = halfWidthAt(yBot, bottomY, apexY, bottomHalf, topHalf);
  return [
    -wBot * s, yBot * s,
    wBot * s, yBot * s,
    wTop * s, yTop * s,
    -wTop * s, yTop * s,
  ];
}

// ── per-variant geometry (scale = 1) ────────────────────────────────
type ConeGeom = {
  baseRx: number;
  baseRy: number;
  apexY: number;
  bottomY: number;
  bottomHalf: number;
  topHalf: number;
  stripes: Array<[number, number]>; // [yTop, yBot] bands
};

const STANDARD: ConeGeom = {
  baseRx: 20, baseRy: 6.5, apexY: -44, bottomY: -3, bottomHalf: 15, topHalf: 4.5,
  stripes: [[-30, -23]],
};

const TALL: ConeGeom = {
  baseRx: 18.5, baseRy: 6, apexY: -62, bottomY: -3, bottomHalf: 14, topHalf: 3.5,
  stripes: [[-29, -22], [-44, -38]],
};

export const ConeShape: React.FC<EquipmentShapeProps> = ({ color, scale, variant }) => {
  const s = scale;
  const stroke = '#ffffff';
  const baseFill = darken(color, 0.22);

  // ── FLAT: disc / marker dome ──────────────────────────────────────
  if (variant === 'flat') {
    const domeH = 14;
    const domeRx = 20;
    const N = 14;
    const dome: number[] = [];
    for (let i = 0; i <= N; i++) {
      const x = -domeRx + (2 * domeRx * i) / N;
      const y = -domeH * Math.sqrt(Math.max(0, 1 - (x / domeRx) ** 2));
      dome.push(x * s, y * s);
    }
    const bodyStroke = Math.max(1, 1.6 * s);
    return (
      <Group listening={false}>
        {/* base rim */}
        <Ellipse x={0} y={0} radiusX={22 * s} radiusY={6.5 * s} fill={baseFill} stroke={stroke} strokeWidth={Math.max(1, 1.4 * s)} listening={false} />
        {/* dome */}
        <Line points={dome} closed fill={color} stroke={stroke} strokeWidth={bodyStroke} lineJoin="round" listening={false} />
        {/* top opening */}
        <Ellipse x={0} y={-12 * s} radiusX={5 * s} radiusY={2 * s} fill={darken(color, 0.42)} stroke={stroke} strokeWidth={Math.max(0.75, 1 * s)} listening={false} />
      </Group>
    );
  }

  // ── STANDARD / TALL: upright cone ─────────────────────────────────
  const g = variant === 'tall' ? TALL : STANDARD;
  const body = [
    -g.bottomHalf * s, g.bottomY * s,
    -g.topHalf * s, g.apexY * s,
    g.topHalf * s, g.apexY * s,
    g.bottomHalf * s, g.bottomY * s,
  ];
  const bodyStroke = Math.max(1, 1.6 * s);

  return (
    <Group listening={false}>
      {/* base plate */}
      <Ellipse x={0} y={0} radiusX={g.baseRx * s} radiusY={g.baseRy * s} fill={baseFill} stroke={stroke} strokeWidth={Math.max(1, 1.4 * s)} listening={false} />
      {/* cone body */}
      <Line points={body} closed fill={color} stroke={stroke} strokeWidth={bodyStroke} lineJoin="round" listening={false} />
      {/* reflective stripes */}
      {g.stripes.map(([yTop, yBot], i) => (
        <Line
          key={i}
          points={stripePoints(yTop, yBot, g.bottomY, g.apexY, g.bottomHalf, g.topHalf, s)}
          closed
          fill={stroke}
          opacity={0.95}
          listening={false}
        />
      ))}
    </Group>
  );
};
