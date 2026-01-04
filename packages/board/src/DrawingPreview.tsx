/**
 * DrawingPreview - Ghost preview while drawing arrows/zones
 */

import { Arrow, Rect, Ellipse } from 'react-konva';
import type { Position } from '@tmc/core';

/** Arrow preview props */
interface ArrowPreviewProps {
  start: Position;
  end: Position;
  type: 'pass' | 'run';
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
  
  return (
    <Arrow
      points={[start.x, start.y, end.x, end.y]}
      stroke={isPass ? '#3B82F6' : '#F97316'}
      strokeWidth={2}
      fill={isPass ? '#3B82F6' : '#F97316'}
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

export default { ArrowPreview, ZonePreview };
