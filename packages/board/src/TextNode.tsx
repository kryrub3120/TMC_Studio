/**
 * Text node component for the tactical board
 * Performance optimized with React.memo
 */

import React, { useRef, useState, useEffect, memo } from 'react';
import { Group, Text, Rect } from 'react-konva';
import type Konva from 'konva';
import type { TextElement, Position, PitchConfig } from '@tmc/core';
import { snapToGrid, clampToBounds } from '@tmc/core';

export interface TextNodeProps {
  text: TextElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  /** Called on mousedown - return true to prevent Konva's default drag (for multi-drag) */
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
  onDoubleClick?: (id: string) => void;
}

const SELECTION_PADDING = 6;

/** Draggable text element */
const TextNodeComponent: React.FC<TextNodeProps> = ({
  text,
  pitchConfig,
  isSelected,
  onSelect,
  onDragEnd,
  onDragStart,
  onDoubleClick,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const textRef = useRef<Konva.Text>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);
  const [textSize, setTextSize] = useState({ width: 50, height: 20 });

  // Measure text dimensions after render
  useEffect(() => {
    if (textRef.current) {
      setTextSize({
        width: textRef.current.width(),
        height: textRef.current.height(),
      });
    }
  }, [text.content, text.fontSize, text.fontFamily, text.bold, text.italic]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(text.id, addToSelection);
  };

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onDoubleClick?.(text.id);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Check if multi-drag should handle this
    if (onDragStart) {
      const stage = e.target.getStage();
      const rect = stage?.container().getBoundingClientRect();
      if (rect) {
        const shouldMultiDrag = onDragStart(
          text.id,
          e.evt.clientX - rect.left,
          e.evt.clientY - rect.top
        );
        if (shouldMultiDrag) {
          // Prevent default Konva drag
          e.cancelBubble = true;
          setMultiDragActive(true);
          return;
        }
      }
    }
    setMultiDragActive(false);
  };

  const handleDragStart = () => {
    if (multiDragActive) return;
    setIsDragging(true);
    if (groupRef.current) {
      groupRef.current.moveToTop();
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    const node = e.target;
    const rawPosition: Position = { x: node.x(), y: node.y() };
    
    // Snap to grid and clamp to bounds
    const snapped = snapToGrid(rawPosition, pitchConfig.gridSize);
    const clamped = clampToBounds(snapped, pitchConfig);
    
    // Update node position to snapped location
    node.x(clamped.x);
    node.y(clamped.y);
    
    onDragEnd(text.id, clamped);
  };

  // Build font style string
  const fontStyle = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic' : ''}`.trim() || 'normal';

  return (
    <Group id={text.id}
      ref={groupRef}
      x={text.position.x}
      y={text.position.y}
      draggable={!multiDragActive}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Background rectangle for visibility */}
      {text.backgroundColor && (
        <Rect
          x={-4}
          y={-2}
          width={textSize.width + 8}
          height={textSize.height + 4}
          fill={text.backgroundColor}
          opacity={0.85}
          cornerRadius={4}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <Rect
          x={-SELECTION_PADDING / 2}
          y={-SELECTION_PADDING / 2}
          width={textSize.width + SELECTION_PADDING}
          height={textSize.height + SELECTION_PADDING}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[4, 4]}
          cornerRadius={4}
          fill="transparent"
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Text content with shadow for readability */}
      <Text
        ref={textRef}
        x={0}
        y={0}
        text={text.content}
        fontSize={text.fontSize}
        fontFamily={text.fontFamily}
        fontStyle={fontStyle}
        fill={text.color}
        shadowColor={isDragging ? undefined : 'rgba(0,0,0,0.5)'}
        shadowBlur={isDragging ? 0 : 2}
        shadowOffset={isDragging ? undefined : { x: 1, y: 1 }}
        shadowEnabled={!isDragging}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

/** Memoized TextNode - only re-renders when props actually change */
export const TextNode = memo(TextNodeComponent, (prevProps, nextProps) => {
  return (
    prevProps.text.id === nextProps.text.id &&
    prevProps.text.position.x === nextProps.text.position.x &&
    prevProps.text.position.y === nextProps.text.position.y &&
    prevProps.text.content === nextProps.text.content &&
    prevProps.text.fontSize === nextProps.text.fontSize &&
    prevProps.text.fontFamily === nextProps.text.fontFamily &&
    prevProps.text.color === nextProps.text.color &&
    prevProps.text.bold === nextProps.text.bold &&
    prevProps.text.italic === nextProps.text.italic &&
    prevProps.text.backgroundColor === nextProps.text.backgroundColor &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export default TextNode;
