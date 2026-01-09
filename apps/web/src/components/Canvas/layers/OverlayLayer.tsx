/**
 * OverlayLayer - Renders temporary UI overlays (selection box, drawing preview)
 */

import { memo } from 'react';
import { Layer, Rect, Line } from 'react-konva';

export interface OverlayLayerProps {
  freehandPoints: Array<{ x: number; y: number }> | null;
  freehandType: 'drawing' | 'highlighter' | null;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;
}

export const OverlayLayer = memo<OverlayLayerProps>(({
  freehandPoints,
  freehandType,
  marqueeStart,
  marqueeEnd,
}) => {
  return (
    <Layer>
      {/* Drawing preview */}
      {freehandPoints && freehandPoints.length > 1 && (
        <Line
          points={freehandPoints.flatMap((p) => [p.x, p.y])}
          stroke={freehandType === 'highlighter' ? '#ffff00' : '#ff0000'}
          strokeWidth={freehandType === 'highlighter' ? 20 : 3}
          opacity={freehandType === 'highlighter' ? 0.4 : 1}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      )}
      
      {/* Marquee selection box */}
      {marqueeStart && marqueeEnd && (
        <Rect
          x={Math.min(marqueeStart.x, marqueeEnd.x)}
          y={Math.min(marqueeStart.y, marqueeEnd.y)}
          width={Math.abs(marqueeEnd.x - marqueeStart.x)}
          height={Math.abs(marqueeEnd.y - marqueeStart.y)}
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[4, 4]}
          fill="rgba(59, 130, 246, 0.1)"
          listening={false}
        />
      )}
    </Layer>
  );
});

OverlayLayer.displayName = 'OverlayLayer';
