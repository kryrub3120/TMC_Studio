/**
 * Text node component for the tactical board
 * Performance optimized with React.memo
 */

import React, { useRef, useState, useEffect, memo } from 'react';
import { Group, Text, Rect } from 'react-konva';
import type Konva from 'konva';
import { cursorGrab, cursorDefault, applyGrabbing, applyGrab } from './cursorUtils';
import type { TextElement, Position, PitchConfig } from '@tmc/core';
import { snapToGrid, clampToBounds } from '@tmc/core';

export interface TextNodeProps {
  text: TextElement;
  pitchConfig: PitchConfig;
  isSelected: boolean;
  isLocked?: boolean;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragEnd: (id: string, position: Position) => void;
  /** Called on mousedown - return true to prevent Konva's default drag (for multi-drag) */
  onDragStart?: (id: string, mouseX: number, mouseY: number) => boolean;
  onDoubleClick?: (id: string) => void;
  /** Print mode flag for render-time color sanitization */
  isPrintMode?: boolean;
  snapEnabled?: boolean;
}

const SELECTION_PADDING = 6;
const LINE_HEIGHT = 1.2;
const CHIP_CORNER_RADIUS = 8;
const CHIP_PAD_X = 8;
const CHIP_PAD_Y = 5;
const DEFAULT_BORDER_WIDTH = 2;

/** Sanitize color for print mode — map all colors to solid black for B/W output */
function sanitizeTextColor(color: string | undefined, isPrintMode: boolean): string {
  // Default: black in print mode, white otherwise
  if (!color) {
    return isPrintMode ? '#000000' : '#ffffff';
  }

  // In print mode, ALL colors → black (pure B/W output)
  if (isPrintMode) {
    return '#000000';
  }

  // Normal mode: sanitize white fallback (defensive — white on white bg is invisible)
  if (color.trim().toLowerCase() === '#ffffff') {
    return '#000000';
  }

  return color;
}

/** Darken a hex color by percent (for a visible default chip border over same-hue fill). */
function darkenHex(hex: string, percent = 30): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Draggable text element */
const TextNodeComponent: React.FC<TextNodeProps> = ({
  text,
  pitchConfig,
  isSelected,
  isLocked = false,
  onSelect,
  onDragEnd,
  onDragStart,
  onDoubleClick,
  isPrintMode,
  snapEnabled = true,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const measureRef = useRef<Konva.Text>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);
  const [textSize, setTextSize] = useState({ width: 50, height: 20 });

  // Effective color with print mode sanitization
  const effectiveColor = sanitizeTextColor(text.color, isPrintMode ?? false);

  // Build font style string
  const fontStyle = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic' : ''}`.trim() || 'normal';

  // Measure NATURAL (unconstrained) text dimensions via a hidden, non-listening
  // Text node. This is intentionally decoupled from the visible <Text> below —
  // the visible node needs an explicit `width` for `align` to take effect
  // (Konva only honors `align` inside a fixed box), and reading .width() off a
  // width-constrained node would just echo that fixed width back, freezing
  // auto-fit forever. Measuring off a separate, always-unconstrained node keeps
  // auto-fit correct no matter what alignment is applied to the visible text.
  useEffect(() => {
    if (measureRef.current) {
      setTextSize({
        width: measureRef.current.width(),
        height: measureRef.current.height(),
      });
    }
  }, [text.content, text.fontSize, text.fontFamily, text.bold, text.italic]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    const addToSelection = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
    onSelect(text.id, addToSelection);
  };

  const handleDblClick = () => {
    onDoubleClick?.(text.id);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isLocked) {
      setMultiDragActive(false);
      return;
    }
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
    applyGrabbing(groupRef);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDragging(false);
    applyGrab(groupRef);
    const node = e.target;
    const rawPosition: Position = { x: node.x(), y: node.y() };

    // Snap to grid and clamp to bounds
    const target = snapEnabled ? snapToGrid(rawPosition, pitchConfig.gridSize) : rawPosition;
    const clamped = clampToBounds(target, pitchConfig);

    // Update node position to snapped location
    node.x(clamped.x);
    node.y(clamped.y);

    onDragEnd(text.id, clamped);
  };

  // Style B chip: solid fill + contrasting border. Background is dropped in
  // print mode, but the border survives (sanitized to black) — that's the
  // point of this style, it reads the same on screen and on paper.
  const hasChip = !!text.backgroundColor;
  const effectiveBgColor = isPrintMode ? undefined : (text.backgroundColor || undefined);
  const effectiveBorderColor = hasChip
    ? (isPrintMode ? '#000000' : (text.borderColor || darkenHex(text.backgroundColor as string, 30)))
    : undefined;
  const borderWidth = text.borderWidth ?? DEFAULT_BORDER_WIDTH;
  const showShadow = !isDragging && !isPrintMode;
  const textAlign = text.textAlign ?? 'left';

  return (
    <Group id={text.id}
      ref={groupRef}
      x={text.position.x}
      y={text.position.y}
      draggable={!multiDragActive && !isLocked}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={isLocked ? cursorDefault : cursorGrab}
      onMouseLeave={cursorDefault}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Chip background + border (Style B). Border alone survives print mode. */}
      {hasChip && (
        <Rect
          x={-CHIP_PAD_X}
          y={-CHIP_PAD_Y}
          width={textSize.width + CHIP_PAD_X * 2}
          height={textSize.height + CHIP_PAD_Y * 2}
          fill={effectiveBgColor}
          stroke={effectiveBorderColor}
          strokeWidth={borderWidth}
          cornerRadius={CHIP_CORNER_RADIUS}
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

      {/* Hidden measurement node — natural (unconstrained) size, never drawn. */}
      <Text
        ref={measureRef}
        x={0}
        y={0}
        text={text.content}
        fontSize={text.fontSize}
        fontFamily={text.fontFamily}
        fontStyle={fontStyle}
        lineHeight={LINE_HEIGHT}
        visible={false}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Visible text content. `width` is required for `align` to take effect —
          Konva only distributes multiline text within an explicit box. */}
      <Text
        x={0}
        y={0}
        width={textSize.width}
        align={textAlign}
        text={text.content}
        fontSize={text.fontSize}
        fontFamily={text.fontFamily}
        fontStyle={fontStyle}
        lineHeight={LINE_HEIGHT}
        fill={effectiveColor}
        shadowColor={showShadow ? 'rgba(0,0,0,0.5)' : undefined}
        shadowBlur={showShadow ? 2 : 0}
        shadowOffset={showShadow ? { x: 1, y: 1 } : undefined}
        shadowEnabled={showShadow}
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
    prevProps.text.borderColor === nextProps.text.borderColor &&
    prevProps.text.borderWidth === nextProps.text.borderWidth &&
    prevProps.text.textAlign === nextProps.text.textAlign &&
    prevProps.isPrintMode === nextProps.isPrintMode && // Print mode affects rendering
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.snapEnabled === nextProps.snapEnabled
  );
});

export default TextNode;
