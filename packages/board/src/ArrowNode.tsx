/**
 * ArrowNode - Konva Arrow component for pass/run/shoot/dribble lines.
 * Supports an optional bend: when `arrow.curveControl` is set the arrow is
 * rendered along a quadratic-bezier centerline. When selected, a mid "bend"
 * handle lets the user drag the arrow into an arc (double-click straightens).
 * Uses window events for endpoint/control dragging (not Konva draggable).
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Group, Circle, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';
import type { ArrowElement, Position, PitchConfig, ArrowHead } from '@tmc/core';

export interface ArrowNodeProps {
  arrow: ArrowElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  isLocked?: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  /** Called on mousedown - return true to prevent Konva's default drag (for multi-drag) */
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
  onEndpointDrag?: (id: string, endpoint: 'start' | 'end' | 'control', position: Position) => void;
  /** Print mode: all arrows render as black, shoot gets 1.5x stroke */
  isPrintMode?: boolean;
}

/** Arrow colors - fallback when no color specified */
const ARROW_COLORS = {
  pass: '#1a1a1a', // Dark gray
  run: '#f97316',  // Orange
  shoot: '#ef4444', // Red
  dribble: '#1d4ed8', // Tactical blue
};

/** Accent color for the bend handle */
const BEND_ACCENT = '#2563eb';

type DraggingEndpoint = 'start' | 'end' | 'control' | null;

// ---------------------------------------------------------------------------
// Geometry helpers (all in coordinates relative to the group center)
// ---------------------------------------------------------------------------

/** Sample a quadratic bezier into a flat [x,y,...] polyline. */
function sampleCurve(
  sx: number, sy: number,
  ex: number, ey: number,
  cx: number, cy: number,
  segments = 28
): number[] {
  const pts: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const mt = 1 - t;
    pts.push(
      mt * mt * sx + 2 * mt * t * cx + t * t * ex,
      mt * mt * sy + 2 * mt * t * cy + t * t * ey
    );
  }
  return pts;
}

/** Cumulative arc-length metrics for a flat polyline. */
function polylineMetrics(pts: number[]) {
  const n = pts.length / 2;
  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < n; i += 1) {
    total += Math.hypot(pts[2 * i] - pts[2 * (i - 1)], pts[2 * i + 1] - pts[2 * (i - 1) + 1]);
    cum.push(total);
  }
  return { cum, total, n };
}

/** Point + unit tangent at arc-length `s` along a flat polyline. */
function pointAt(pts: number[], cum: number[], total: number, s: number) {
  const clamped = Math.max(0, Math.min(total, s));
  let i = 1;
  while (i < cum.length && cum[i] < clamped) i += 1;
  const i0 = i - 1;
  const i1 = Math.min(i, cum.length - 1);
  const segLen = (cum[i1] - cum[i0]) || 1;
  const t = (clamped - cum[i0]) / segLen;
  const x0 = pts[2 * i0];
  const y0 = pts[2 * i0 + 1];
  const x1 = pts[2 * i1];
  const y1 = pts[2 * i1 + 1];
  let tx = x1 - x0;
  let ty = y1 - y0;
  const tl = Math.hypot(tx, ty) || 1;
  tx /= tl;
  ty /= tl;
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, tx, ty };
}

/** Build the dribble wave along a (possibly curved) centerline. */
function getDribblePoints(centerline: number[]): number[] {
  const { cum, total } = polylineMetrics(centerline);
  const sx = centerline[0];
  const sy = centerline[1];
  const ex = centerline[centerline.length - 2];
  const ey = centerline[centerline.length - 1];

  if (total < 24) return [sx, sy, ex, ey];

  const headReserve = Math.min(20, total * 0.22);
  const bodyLength = Math.max(8, total - headReserve);
  const waveCount = Math.max(3, Math.min(9, Math.round(bodyLength / 28)));
  const amplitude = Math.max(8, Math.min(13, total * 0.05));

  const points: number[] = [sx, sy];
  for (let i = 1; i <= waveCount; i += 1) {
    const s = bodyLength * (i / (waveCount + 1));
    const p = pointAt(centerline, cum, total, s);
    const px = -p.ty;
    const py = p.tx;
    const offset = (i % 2 === 0 ? -1 : 1) * amplitude;
    points.push(p.x + px * offset, p.y + py * offset);
  }
  const bodyEnd = pointAt(centerline, cum, total, bodyLength);
  points.push(bodyEnd.x, bodyEnd.y, ex, ey);
  return points;
}

/** Render a single arrow head at a given point, oriented along the tangent. */
function renderArrowHead(
  px: number, py: number,
  tx: number, ty: number,
  headType: ArrowHead,
  color: string,
  strokeWidth: number
): React.ReactNode {
  const headLen = Math.max(8, strokeWidth * 4);
  const headW = Math.max(6, strokeWidth * 3);

  switch (headType) {
    case 'none':
      return null;
    case 'bar': {
      // Short perpendicular bar
      const barLen = Math.max(4, strokeWidth * 2.5);
      const perpX = -ty * barLen;
      const perpY = tx * barLen;
      return (
        <Line
          points={[px - perpX, py - perpY, px + perpX, py + perpY]}
          stroke={color}
          strokeWidth={Math.max(1.5, strokeWidth * 0.8)}
          lineCap="round"
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    case 'dot': {
      const dotR = Math.max(3, strokeWidth * 1.2);
      return (
        <Circle
          x={px}
          y={py}
          radius={dotR}
          fill={color}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
    case 'arrow':
    default: {
      // Triangle arrowhead
      const bx = px - tx * headLen;
      const by = py - ty * headLen;
      const perpX = -ty * headW;
      const perpY = tx * headW;
      return (
        <Line
          points={[px, py, bx + perpX, by + perpY, bx - perpX, by - perpY]}
          fill={color}
          closed
          strokeEnabled={false}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
  }
}

/** Render heads at both ends of a centerline (for pass/run/dribble lines without built-in arrows). */
function renderBothHeads(
  centerline: number[],
  startHead: ArrowHead,
  endHead: ArrowHead,
  color: string,
  strokeWidth: number
): React.ReactNode[] {
  const { cum, total } = polylineMetrics(centerline);
  const nodes: React.ReactNode[] = [];

  if (startHead !== 'none' && total > 0) {
    const s = pointAt(centerline, cum, total, 0);
    nodes.push(
      <React.Fragment key="start-head">
        {renderArrowHead(s.x, s.y, -s.tx, -s.ty, startHead, color, strokeWidth)}
      </React.Fragment>
    );
  }
  if (endHead !== 'none' && total > 0) {
    const e = pointAt(centerline, cum, total, total);
    nodes.push(
      <React.Fragment key="end-head">
        {renderArrowHead(e.x, e.y, e.tx, e.ty, endHead, color, strokeWidth)}
      </React.Fragment>
    );
  }

  return nodes;
}
function renderShootArrow(
  centerline: number[],
  color: string,
  strokeWidth: number,
  startHead: ArrowHead = 'none',
  endHead: ArrowHead = 'arrow'
) {
  const { cum, total } = polylineMetrics(centerline);
  const sx = centerline[0];
  const sy = centerline[1];
  const ex = centerline[centerline.length - 2];
  const ey = centerline[centerline.length - 1];

  if (total < 10) {
    const heads = renderBothHeads(centerline, startHead, endHead, color, strokeWidth);
    return (
      <>
        <Line
          points={[sx, sy, ex, ey]}
          stroke={color}
          strokeWidth={strokeWidth}
          lineCap="round"
          lineJoin="round"
          hitStrokeWidth={15}
        />
        {heads}
      </>
    );
  }

  const headLength = Math.min(22, Math.max(15, total * 0.18));
  const headWidth = Math.min(15, Math.max(10, strokeWidth * 2.6));
  const gap = Math.max(4, strokeWidth * 1.05);
  const bodyLen = Math.max(1, total - headLength);

  const seg = Math.max(8, Math.round(bodyLen / 6));
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i <= seg; i += 1) {
    const p = pointAt(centerline, cum, total, (bodyLen * i) / seg);
    const px = -p.ty;
    const py = p.tx;
    left.push(p.x + px * gap, p.y + py * gap);
    right.push(p.x - px * gap, p.y - py * gap);
  }

  const tip = pointAt(centerline, cum, total, total);
  const base = pointAt(centerline, cum, total, bodyLen);
  const bpx = -base.ty;
  const bpy = base.tx;
  const leftHX = base.x + bpx * headWidth;
  const leftHY = base.y + bpy * headWidth;
  const rightHX = base.x - bpx * headWidth;
  const rightHY = base.y - bpy * headWidth;

  return (
    <>
      <Line
        points={left}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={15}
      />
      <Line
        points={right}
        stroke={color}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={15}
      />
      <Line
        points={[tip.x, tip.y, leftHX, leftHY, rightHX, rightHY]}
        fill={color}
        strokeEnabled={false}
        closed
        listening={false}
      />
      {/* Start head for shoot arrows */}
      {startHead !== 'none' && (() => {
        const startPt = pointAt(centerline, cum, total, 0);
        return renderArrowHead(startPt.x, startPt.y, -startPt.tx, -startPt.ty, startHead, color, strokeWidth);
      })()}
    </>
  );
}

/** ArrowNode component */
export const ArrowNode: React.FC<ArrowNodeProps> = ({
  arrow,
  pitchConfig: _pitchConfig,
  isSelected,
  isLocked = false,
  onSelect,
  onDragEnd,
  onDragStart,
  onEndpointDrag,
  isPrintMode,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [multiDragActive, setMultiDragActive] = useState(false);

  // Endpoint/control drag state
  const [draggingEndpoint, setDraggingEndpoint] = useState<DraggingEndpoint>(null);
  const dragDataRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPointX: number;
    startPointY: number;
  } | null>(null);

  // Preview positions during drag
  const [previewStart, setPreviewStart] = useState<Position | null>(null);
  const [previewEnd, setPreviewEnd] = useState<Position | null>(null);
  const [previewControl, setPreviewControl] = useState<Position | null>(null);

  const color = arrow.color || ARROW_COLORS[arrow.arrowType];
  const strokeWidth = arrow.strokeWidth || (arrow.arrowType === 'pass' ? 3 : 2);
  const dash = arrow.arrowType === 'run' ? [8, 4] : undefined;

  // Arrow head options
  const startHead = arrow.startHead ?? 'none';
  const endHead = arrow.endHead ?? 'arrow';

  // Print mode: all arrows black, shoot gets 1.5x stroke for visual distinction
  const effectiveColor = isPrintMode ? '#000000' : color;
  const effectiveStrokeWidth = isPrintMode && arrow.arrowType === 'shoot'
    ? strokeWidth * 1.5
    : strokeWidth;

  // Use preview positions if dragging, otherwise use arrow positions
  const displayStart = previewStart || arrow.startPoint;
  const displayEnd = previewEnd || arrow.endPoint;
  const displayControl = previewControl || arrow.curveControl || null;
  const hasCurve = !!displayControl;

  // Calculate center for group position (midpoint of start/end)
  const centerX = (displayStart.x + displayEnd.x) / 2;
  const centerY = (displayStart.y + displayEnd.y) / 2;

  // Relative positions from center
  const startRelX = displayStart.x - centerX;
  const startRelY = displayStart.y - centerY;
  const endRelX = displayEnd.x - centerX;
  const endRelY = displayEnd.y - centerY;
  const ctrlRelX = displayControl ? displayControl.x - centerX : 0;
  const ctrlRelY = displayControl ? displayControl.y - centerY : 0;

  // The bend handle / number badge sit at the curve apex (t = 0.5). Because the
  // center is the midpoint of start & end, startRel + endRel = 0, so the apex
  // simplifies to half the relative control point.
  const apexRelX = ctrlRelX / 2;
  const apexRelY = ctrlRelY / 2;

  // Centerline used by every arrow type.
  const centerline = hasCurve
    ? sampleCurve(startRelX, startRelY, endRelX, endRelY, ctrlRelX, ctrlRelY)
    : [startRelX, startRelY, endRelX, endRelY];

  // Global mouse event handlers for endpoint/control dragging
  useEffect(() => {
    if (!draggingEndpoint) return;

    const handleMouseMove = (e: MouseEvent) => {
      const stage = groupRef.current?.getStage();
      if (!stage || !dragDataRef.current) return;

      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = mouseX - dragDataRef.current.startMouseX;
      const dy = mouseY - dragDataRef.current.startMouseY;

      const newX = dragDataRef.current.startPointX + dx;
      const newY = dragDataRef.current.startPointY + dy;

      if (draggingEndpoint === 'start') {
        setPreviewStart({ x: newX, y: newY });
      } else if (draggingEndpoint === 'end') {
        setPreviewEnd({ x: newX, y: newY });
      } else {
        // 'control': newX/newY is where the apex (point on the curve) should be.
        // Convert apex -> quadratic control point: C = 2*apex - center.
        setPreviewControl({ x: 2 * newX - centerX, y: 2 * newY - centerY });
      }
    };

    const handleMouseUp = () => {
      if (onEndpointDrag) {
        if (draggingEndpoint === 'start' && previewStart) {
          onEndpointDrag(arrow.id, 'start', previewStart);
        } else if (draggingEndpoint === 'end' && previewEnd) {
          onEndpointDrag(arrow.id, 'end', previewEnd);
        } else if (draggingEndpoint === 'control' && previewControl) {
          onEndpointDrag(arrow.id, 'control', previewControl);
        }
      }

      setDraggingEndpoint(null);
      setPreviewStart(null);
      setPreviewEnd(null);
      setPreviewControl(null);
      dragDataRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingEndpoint, previewStart, previewEnd, previewControl, centerX, centerY, arrow.id, onEndpointDrag]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect(arrow.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
    },
    [arrow.id, onSelect]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isLocked) {
        setMultiDragActive(false);
        return;
      }
      if (!onDragStart) {
        setMultiDragActive(false);
        return;
      }

      const stage = e.target.getStage();
      const rect = stage?.container().getBoundingClientRect();
      if (!rect) {
        setMultiDragActive(false);
        return;
      }

      const shouldMultiDrag = onDragStart(
        arrow.id,
        e.evt.clientX - rect.left,
        e.evt.clientY - rect.top
      );
      if (shouldMultiDrag) {
        e.cancelBubble = true;
        setMultiDragActive(true);
        return;
      }
      setMultiDragActive(false);
    },
    [arrow.id, isLocked, onDragStart]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (draggingEndpoint || multiDragActive) return;
      applyGrab(groupRef);
      const node = e.target;
      const originalCenterX = (arrow.startPoint.x + arrow.endPoint.x) / 2;
      const originalCenterY = (arrow.startPoint.y + arrow.endPoint.y) / 2;
      const dx = node.x() - originalCenterX;
      const dy = node.y() - originalCenterY;

      // Move both endpoints (and the bend control, if any) by the delta so the
      // whole curved arrow translates rigidly.
      if (onEndpointDrag) {
        onEndpointDrag(arrow.id, 'start', {
          x: arrow.startPoint.x + dx,
          y: arrow.startPoint.y + dy,
        });
        onEndpointDrag(arrow.id, 'end', {
          x: arrow.endPoint.x + dx,
          y: arrow.endPoint.y + dy,
        });
        if (arrow.curveControl) {
          onEndpointDrag(arrow.id, 'control', {
            x: arrow.curveControl.x + dx,
            y: arrow.curveControl.y + dy,
          });
        }
      }

      onDragEnd(arrow.id, { x: node.x(), y: node.y() });
    },
    [arrow.id, arrow.startPoint, arrow.endPoint, arrow.curveControl, onDragEnd, onEndpointDrag, draggingEndpoint, multiDragActive]
  );

  // Start endpoint drag
  const handleEndpointMouseDown = useCallback(
    (endpoint: 'start' | 'end', e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (isLocked) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.evt.clientX - rect.left;
      const mouseY = e.evt.clientY - rect.top;

      const point = endpoint === 'start' ? arrow.startPoint : arrow.endPoint;

      dragDataRef.current = {
        startMouseX: mouseX,
        startMouseY: mouseY,
        startPointX: point.x,
        startPointY: point.y,
      };

      setDraggingEndpoint(endpoint);
    },
    [arrow.startPoint, arrow.endPoint, isLocked]
  );

  // Start bend (control) drag. The handle represents the apex of the curve.
  const handleControlMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (isLocked) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.evt.clientX - rect.left;
      const mouseY = e.evt.clientY - rect.top;

      const cX = (arrow.startPoint.x + arrow.endPoint.x) / 2;
      const cY = (arrow.startPoint.y + arrow.endPoint.y) / 2;
      // Current apex (point on the curve) in absolute coords.
      const apexX = arrow.curveControl ? (cX + arrow.curveControl.x) / 2 : cX;
      const apexY = arrow.curveControl ? (cY + arrow.curveControl.y) / 2 : cY;

      dragDataRef.current = {
        startMouseX: mouseX,
        startMouseY: mouseY,
        startPointX: apexX,
        startPointY: apexY,
      };

      setDraggingEndpoint('control');
    },
    [arrow.startPoint, arrow.endPoint, arrow.curveControl, isLocked]
  );

  // Double-click the bend handle to straighten the arrow.
  const handleControlDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (onEndpointDrag) {
        const cX = (arrow.startPoint.x + arrow.endPoint.x) / 2;
        const cY = (arrow.startPoint.y + arrow.endPoint.y) / 2;
        onEndpointDrag(arrow.id, 'control', { x: cX, y: cY });
      }
    },
    [arrow.id, arrow.startPoint, arrow.endPoint, onEndpointDrag]
  );

  return (
    <Group id={arrow.id}
      ref={groupRef}
      x={centerX}
      y={centerY}
      draggable={!multiDragActive && !draggingEndpoint && !isLocked}
      onClick={handleClick}
      onTap={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={isLocked ? cursorDefault : cursorGrab}
      onMouseLeave={cursorDefault}
      onDragStart={() => { if (!multiDragActive && !isLocked) applyGrabbing(groupRef); }}
      onDragEnd={handleDragEnd}
    >
      {/* Shoot arrow - double parallel lines + custom heads */}
      {arrow.arrowType === 'shoot' ? renderShootArrow(
        centerline,
        effectiveColor,
        effectiveStrokeWidth,
        startHead,
        endHead
      ) : arrow.arrowType === 'dribble' ? (
        <>
          <Line
            points={getDribblePoints(centerline)}
            stroke={effectiveColor}
            strokeWidth={effectiveStrokeWidth}
            tension={hasCurve ? 0 : 0.35}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={16}
          />
          {renderBothHeads(getDribblePoints(centerline), startHead, endHead, effectiveColor, effectiveStrokeWidth)}
        </>
      ) : (
        /* Standard arrow (pass/run) - straight or curved */
        <>
          <Line
            points={centerline}
            stroke={effectiveColor}
            strokeWidth={effectiveStrokeWidth}
            dash={dash}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={15}
          />
          {renderBothHeads(centerline, startHead, endHead, effectiveColor, effectiveStrokeWidth)}
        </>
      )}

      {/* Arrow number label (PR-ARROW-NUMBER) - sits at the curve apex */}
      {arrow.showNumber && arrow.number !== undefined && (() => {
        const midX = apexRelX;
        const midY = apexRelY;
        const radius = 12;
        return (
          <Group listening={false}>
            <Circle
              x={midX}
              y={midY}
              radius={radius}
              fill="#1a1a1a"
              stroke="#ffffff"
              strokeWidth={1.5}
              opacity={0.85}
            />
            <Text
              x={midX - radius}
              y={midY - radius}
              width={radius * 2}
              height={radius * 2}
              text={String(arrow.number)}
              fontSize={13}
              fontStyle="bold"
              fill="#ffffff"
              align="center"
              verticalAlign="middle"
            />
          </Group>
        );
      })()}

      {/* Selection highlight, endpoint handles, and bend handle */}
      {isSelected && !isLocked && (
        <>
          {/* Start endpoint handle */}
          <Circle
            x={startRelX}
            y={startRelY}
            radius={8}
            fill="#fff"
            stroke={effectiveColor}
            strokeWidth={2}
            onMouseDown={(e) => handleEndpointMouseDown('start', e)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'move';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          {/* End endpoint handle */}
          <Circle
            x={endRelX}
            y={endRelY}
            radius={8}
            fill="#fff"
            stroke={effectiveColor}
            strokeWidth={2}
            onMouseDown={(e) => handleEndpointMouseDown('end', e)}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'move';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />

          {/* Bend handle (apex) - drag to curve, double-click to straighten */}
          <Circle
            x={apexRelX}
            y={apexRelY}
            radius={7}
            fill={hasCurve ? BEND_ACCENT : '#fff'}
            stroke={BEND_ACCENT}
            strokeWidth={2}
            shadowColor="#000000"
            shadowBlur={hasCurve ? 4 : 0}
            shadowOpacity={0.25}
            onMouseDown={handleControlMouseDown}
            onDblClick={handleControlDblClick}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = 'default';
            }}
          />
          {/* Inner dot so the bend handle reads as distinct from endpoints */}
          <Circle
            x={apexRelX}
            y={apexRelY}
            radius={2}
            fill={hasCurve ? '#fff' : BEND_ACCENT}
            listening={false}
          />
        </>
      )}
    </Group>
  );
};

export default ArrowNode;
