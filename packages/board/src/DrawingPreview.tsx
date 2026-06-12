/**
 * DrawingPreview - Ghost preview while drawing arrows/zones
 */

import { Arrow, Rect, Ellipse, Line, Circle, Group } from 'react-konva';
import type { Position } from '@tmc/core';

/** Arrow preview props */
interface ArrowPreviewProps {
  start: Position;
  end: Position;
  type: 'pass' | 'run' | 'shoot' | 'dribble';
}

/** Zone preview props */
interface ZonePreviewProps {
  start: Position;
  end: Position;
  shape: 'rect' | 'ellipse';
}

/** Arrow preview while drawing */
export const ArrowPreview: React.FC<ArrowPreviewProps> = ({ start, end, type }) => {
  const isPass = type === 'pass';
  const color = type === 'pass' ? '#3B82F6' : type === 'run' ? '#F97316' : type === 'shoot' ? '#EF4444' : '#1D4ED8';

  if (type === 'shoot') {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length >= 10) {
      const ux = dx / length;
      const uy = dy / length;
      const px = -uy;
      const py = ux;
      const headLength = Math.min(20, Math.max(14, length * 0.18));
      const headWidth = 11;
      const gap = 4;
      const baseX = end.x - ux * headLength;
      const baseY = end.y - uy * headLength;

      return (
        <>
          <Line
            points={[start.x + px * gap, start.y + py * gap, baseX + px * gap, baseY + py * gap]}
            stroke={color}
            strokeWidth={2.5}
            opacity={0.55}
            lineCap="round"
            listening={false}
          />
          <Line
            points={[start.x - px * gap, start.y - py * gap, baseX - px * gap, baseY - py * gap]}
            stroke={color}
            strokeWidth={2.5}
            opacity={0.55}
            lineCap="round"
            listening={false}
          />
          <Line
            points={[
              end.x,
              end.y,
              baseX + px * headWidth,
              baseY + py * headWidth,
              baseX - px * headWidth,
              baseY - py * headWidth,
            ]}
            fill={color}
            opacity={0.55}
            closed
            listening={false}
          />
        </>
      );
    }
  }

  if (type === 'dribble') {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const points = length < 24 ? [start.x, start.y, end.x, end.y] : (() => {
      const ux = dx / length;
      const uy = dy / length;
      const px = -uy;
      const py = ux;
      const bodyLength = Math.max(8, length - 18);
      const waveCount = Math.max(3, Math.min(9, Math.round(bodyLength / 28)));
      const amplitude = Math.max(8, Math.min(13, length * 0.05));
      const next = [start.x, start.y];
      for (let i = 1; i <= waveCount; i += 1) {
        const t = i / (waveCount + 1);
        const offset = (i % 2 === 0 ? -1 : 1) * amplitude;
        next.push(start.x + ux * bodyLength * t + px * offset, start.y + uy * bodyLength * t + py * offset);
      }
      next.push(start.x + ux * bodyLength, start.y + uy * bodyLength, end.x, end.y);
      return next;
    })();

    return (
      <Arrow
        points={points}
        stroke={color}
        strokeWidth={2.5}
        fill={color}
        pointerLength={11}
        pointerWidth={9}
        tension={0.35}
        opacity={0.55}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    );
  }
  
  return (
    <Arrow
      points={[start.x, start.y, end.x, end.y]}
      stroke={color}
      strokeWidth={2}
      fill={color}
      pointerLength={10}
      pointerWidth={8}
      dash={isPass ? undefined : [8, 4]}
      opacity={0.5}
      listening={false}
    />
  );
};

/** Zone preview while drawing */
export const ZonePreview: React.FC<ZonePreviewProps> = ({ start, end, shape }) => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  
  const commonProps = {
    x,
    y,
    fill: 'rgba(34, 197, 94, 0.2)',
    stroke: '#22C55E',
    strokeWidth: 2,
    dash: [6, 3],
    opacity: 0.7,
    listening: false,
  };
  
  if (shape === 'ellipse') {
    return (
      <Ellipse
        {...commonProps}
        x={x + width / 2}
        y={y + height / 2}
        radiusX={width / 2}
        radiusY={height / 2}
      />
    );
  }
  
  return (
    <Rect
      {...commonProps}
      width={width}
      height={height}
      cornerRadius={4}
    />
  );
};

/** Polygon zone preview props */
interface PolygonPreviewProps {
  /** Committed vertices as flat absolute coords [x1,y1,...] */
  points: number[];
  /** Live cursor for the rubber-band segment (null when no points yet) */
  cursor: Position | null;
}

/** Polygon preview while placing vertices (click-to-add, double-click to finish) */
export const PolygonPreview: React.FC<PolygonPreviewProps> = ({ points, cursor }) => {
  if (!points || points.length < 2) return null;

  const color = '#22C55E';

  // Rubber-band: line from the last placed vertex to the cursor.
  const lastX = points[points.length - 2];
  const lastY = points[points.length - 1];

  // Closed-shape preview once we have at least 3 vertices.
  const showFill = points.length >= 6;

  // Vertex dots
  const dots: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points.length; i += 2) {
    dots.push({ x: points[i], y: points[i + 1] });
  }

  return (
    <Group listening={false}>
      {showFill && (
        <Line
          points={points}
          closed
          fill="rgba(34, 197, 94, 0.18)"
          stroke={color}
          strokeWidth={2}
          dash={[6, 3]}
          listening={false}
        />
      )}
      {!showFill && (
        <Line
          points={points}
          stroke={color}
          strokeWidth={2}
          dash={[6, 3]}
          listening={false}
        />
      )}

      {/* Rubber-band to cursor */}
      {cursor && (
        <Line
          points={[lastX, lastY, cursor.x, cursor.y]}
          stroke={color}
          strokeWidth={1.5}
          dash={[4, 4]}
          opacity={0.7}
          listening={false}
        />
      )}

      {/* Vertex markers */}
      {dots.map((d, i) => (
        <Circle
          key={i}
          x={d.x}
          y={d.y}
          radius={i === 0 ? 5 : 4}
          fill={i === 0 ? color : '#ffffff'}
          stroke={color}
          strokeWidth={2}
          listening={false}
        />
      ))}
    </Group>
  );
};

export default { ArrowPreview, ZonePreview, PolygonPreview };
