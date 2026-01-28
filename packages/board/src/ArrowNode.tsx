/**
 * ArrowNode - Konva Arrow component for pass/run lines
 * Uses window events for endpoint dragging (not Konva draggable)
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Group, Arrow, Circle } from 'react-konva';
import type Konva from 'konva';
import type { ArrowElement, Position, PitchConfig } from '@tmc/core';

export interface ArrowNodeProps {
  arrow: ArrowElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  onEndpointDrag?: (id: string, endpoint: 'start' | 'end', position: Position) => void;
}

/** Arrow colors */
const ARROW_COLORS = {
  pass: '#3b82f6', // Blue
  run: '#f97316', // Orange
  shoot: '#f97316', // Orange (same as run for now)
};

type DraggingEndpoint = 'start' | 'end' | null;

/** ArrowNode component */
export const ArrowNode: React.FC<ArrowNodeProps> = ({
  arrow,
  pitchConfig: _pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
  onEndpointDrag,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  
  // Endpoint drag state
  const [draggingEndpoint, setDraggingEndpoint] = useState<DraggingEndpoint>(null);
  const dragDataRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPointX: number;
    startPointY: number;
  } | null>(null);
  
  // Preview position during drag
  const [previewStart, setPreviewStart] = useState<Position | null>(null);
  const [previewEnd, setPreviewEnd] = useState<Position | null>(null);

  const color = arrow.color || ARROW_COLORS[arrow.arrowType];
  const strokeWidth = arrow.strokeWidth || (arrow.arrowType === 'pass' ? 3 : 2);
  const dash = arrow.arrowType === 'run' ? [8, 4] : undefined;

  // Use preview positions if dragging, otherwise use arrow positions
  const displayStart = previewStart || arrow.startPoint;
  const displayEnd = previewEnd || arrow.endPoint;

  // Calculate center for group position
  const centerX = (displayStart.x + displayEnd.x) / 2;
  const centerY = (displayStart.y + displayEnd.y) / 2;

  // Relative positions from center
  const startRelX = displayStart.x - centerX;
  const startRelY = displayStart.y - centerY;
  const endRelX = displayEnd.x - centerX;
  const endRelY = displayEnd.y - centerY;

  // Global mouse event handlers for endpoint dragging
  useEffect(() => {
    if (!draggingEndpoint) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const stage = groupRef.current?.getStage();
      if (!stage || !dragDataRef.current) return;
      
      // Get mouse position relative to stage
      const rect = stage.container().getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate delta from start
      const dx = mouseX - dragDataRef.current.startMouseX;
      const dy = mouseY - dragDataRef.current.startMouseY;
      
      // Calculate new position
      const newX = dragDataRef.current.startPointX + dx;
      const newY = dragDataRef.current.startPointY + dy;
      
      if (draggingEndpoint === 'start') {
        setPreviewStart({ x: newX, y: newY });
      } else {
        setPreviewEnd({ x: newX, y: newY });
      }
    };
    
    const handleMouseUp = () => {
      // Apply final position
      if (onEndpointDrag) {
        if (draggingEndpoint === 'start' && previewStart) {
          onEndpointDrag(arrow.id, 'start', previewStart);
        } else if (draggingEndpoint === 'end' && previewEnd) {
          onEndpointDrag(arrow.id, 'end', previewEnd);
        }
      }
      
      // Clear state
      setDraggingEndpoint(null);
      setPreviewStart(null);
      setPreviewEnd(null);
      dragDataRef.current = null;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingEndpoint, previewStart, previewEnd, arrow.id, onEndpointDrag]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect(arrow.id, e.evt.shiftKey || e.evt.metaKey);
    },
    [arrow.id, onSelect]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (draggingEndpoint) return;
      const node = e.target;
      // Calculate the delta from original center
      const originalCenterX = (arrow.startPoint.x + arrow.endPoint.x) / 2;
      const originalCenterY = (arrow.startPoint.y + arrow.endPoint.y) / 2;
      const dx = node.x() - originalCenterX;
      const dy = node.y() - originalCenterY;
      
      // Move both endpoints by the delta
      if (onEndpointDrag) {
        onEndpointDrag(arrow.id, 'start', {
          x: arrow.startPoint.x + dx,
          y: arrow.startPoint.y + dy,
        });
        onEndpointDrag(arrow.id, 'end', {
          x: arrow.endPoint.x + dx,
          y: arrow.endPoint.y + dy,
        });
      }
      
      onDragEnd(arrow.id, { x: node.x(), y: node.y() });
    },
    [arrow.id, arrow.startPoint, arrow.endPoint, onDragEnd, onEndpointDrag, draggingEndpoint]
  );

  // Start endpoint drag
  const handleEndpointMouseDown = useCallback(
    (endpoint: 'start' | 'end', e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      
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
    [arrow.startPoint, arrow.endPoint]
  );

  return (
    <Group id={arrow.id}
      ref={groupRef}
      x={centerX}
      y={centerY}
      draggable={!draggingEndpoint}
      onClick={handleClick}
      onTap={handleClick}
      onDragEnd={handleDragEnd}
    >
      {/* Arrow line */}
      <Arrow
        points={[startRelX, startRelY, endRelX, endRelY]}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={color}
        pointerLength={10}
        pointerWidth={8}
        dash={dash}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={15}
      />
      
      {/* Double chevron for shoot arrows */}
      {arrow.arrowType === 'shoot' && (() => {
        // Calculate vector and length
        const dx = endRelX - startRelX;
        const dy = endRelY - startRelY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Only show second chevron if arrow is long enough (> 20px)
        if (length < 20) return null;
        
        // Calculate point 15px before the end (second chevron position)
        const offset = 15;
        const ratio = (length - offset) / length;
        const secondChevronX = startRelX + dx * ratio;
        const secondChevronY = startRelY + dy * ratio;
        
        return (
          <Arrow
            points={[startRelX, startRelY, secondChevronX, secondChevronY]}
            stroke={color}
            strokeWidth={strokeWidth}
            fill={color}
            pointerLength={10}
            pointerWidth={8}
            lineCap="round"
            lineJoin="round"
            listening={false} // Don't interfere with selection
          />
        );
      })()}

      {/* Selection highlight and endpoint handles */}
      {isSelected && (
        <>
          {/* Start endpoint handle */}
          <Circle
            x={startRelX}
            y={startRelY}
            radius={8}
            fill="#fff"
            stroke={color}
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
            stroke={color}
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
        </>
      )}
    </Group>
  );
};

export default ArrowNode;
