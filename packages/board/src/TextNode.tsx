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
  /** Called after a Transformer handle drag — commits a new manual chip width
   *  (word-wrap reflow) instead of a raw visual scale. */
  onResize?: (id: string, boxWidth: number, position?: Position) => void;
  /** Allows parent overlays to get out of the way while width handles are active. */
  onResizeStateChange?: (id: string, isResizing: boolean) => void;
  /** Reports the actual rendered chip box size (including padding) whenever
   *  it changes — lets callers (e.g. a floating toolbar) position themselves
   *  precisely against the real chip instead of guessing/duplicating this
   *  component's width logic. */
  onMeasure?: (id: string, box: { width: number; height: number }) => void;
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
const MIN_BOX_WIDTH = 30;

type TextResizePreview = {
  boxWidth: number;
  position: Position;
};

/** Sanitize color for print mode — map all colors to solid black for B/W output.
 *  Only used for plain text (no chip background) — chip text uses auto-contrast
 *  below instead, since its color must track a background the user picks. */
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

/** Pick white or black ink for readable contrast against a given hex fill.
 *  Used whenever a chip background is present — the user picks the chip
 *  color, ink follows automatically so it never blends into it (e.g. black
 *  or dark-gray backgrounds no longer strand dark text on top of them). */
function getContrastInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000000' : '#ffffff';
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
  onResize,
  onResizeStateChange,
  onMeasure,
  isPrintMode,
  snapEnabled = true,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const measureRef = useRef<Konva.Text>(null);
  const resizeStartWidthRef = useRef(MIN_BOX_WIDTH);
  const resizePreviewRef = useRef<TextResizePreview | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [multiDragActive, setMultiDragActive] = useState(false);
  const [textSize, setTextSize] = useState({ width: 50, height: 20 });
  const [resizePreview, setResizePreview] = useState<TextResizePreview | null>(null);

  // Style B chip: solid fill + contrasting border. Background is dropped in
  // print mode, but the border survives (sanitized to black) — that's the
  // point of this style, it reads the same on screen and on paper.
  const hasChip = !!text.backgroundColor;

  // Ink color: when a chip is present, auto-contrast against its background
  // instead of the user's independently-cycled ink color — this is what
  // keeps black/dark-gray (or any) chip colors from stranding unreadable
  // text on top of them. Plain text (no chip) keeps the manually cycled color.
  const effectiveColor = hasChip
    ? (isPrintMode ? '#000000' : getContrastInk(text.backgroundColor as string))
    : sanitizeTextColor(text.color, isPrintMode ?? false);

  // Build font style string
  const fontStyle = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic' : ''}`.trim() || 'normal';

  // Manual width override (drag-to-stretch via the Transformer). A local
  // resize preview takes precedence during handle drags so the text reflows
  // live without committing every pointer move to the app store/history.
  const manualBoxWidth = typeof text.boxWidth === 'number' ? text.boxWidth : null;
  const constrainedBoxWidth = resizePreview?.boxWidth ?? manualBoxWidth;
  const hasConstrainedWidth = typeof constrainedBoxWidth === 'number';
  const boxWidthProps = hasConstrainedWidth
    ? { width: constrainedBoxWidth, wrap: 'word' as const }
    : {};

  // Measure text dimensions via a hidden, non-listening Text node. Decoupled
  // from the visible <Text> below on purpose — the visible node needs an
  // explicit `width` for `align` (and now for manual-width word-wrap) to take
  // effect, and reading .width() off a width-constrained node would just echo
  // that fixed width back. Mirroring the same width/wrap props here means:
  // - auto mode: natural (unconstrained) size, exactly like before.
  // - manual width mode: width stays pinned to the manual value (expected —
  //   that IS the box width now), while height correctly reflects the
  //   word-wrapped line count at that width.
  useEffect(() => {
    if (measureRef.current) {
      setTextSize({
        width: measureRef.current.width(),
        height: measureRef.current.height(),
      });
    }
  }, [text.content, text.fontSize, text.fontFamily, text.bold, text.italic, constrainedBoxWidth]);

  useEffect(() => {
    return () => {
      if (resizeFrameRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, []);

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

  const queueResizePreview = (preview: TextResizePreview) => {
    resizePreviewRef.current = preview;
    if (typeof window === 'undefined') {
      setResizePreview(preview);
      return;
    }
    if (resizeFrameRef.current !== null) return;
    resizeFrameRef.current = window.requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      if (resizePreviewRef.current) {
        setResizePreview(resizePreviewRef.current);
      }
    });
  };

  // Konva's Transformer tries to scale the whole Group. Instead, convert every
  // scale tick into a real text-box width, reset scale back to 1, and reflow
  // the Text node live. This keeps glyphs readable throughout the drag.
  const handleTransformStart = () => {
    const node = groupRef.current;
    const startPosition = node ? { x: node.x(), y: node.y() } : text.position;
    resizeStartWidthRef.current = boxWidth;
    queueResizePreview({ boxWidth, position: startPosition });
    onResizeStateChange?.(text.id, true);
  };

  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const nextWidth = Math.max(MIN_BOX_WIDTH, Math.round(resizeStartWidthRef.current * Math.abs(scaleX)));
    const nextPreview = {
      boxWidth: nextWidth,
      position: { x: node.x(), y: node.y() },
    };

    node.scaleX(1);
    node.scaleY(1);
    resizeStartWidthRef.current = nextWidth;
    queueResizePreview(nextPreview);
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    if (scaleX !== 1) {
      const nextWidth = Math.max(MIN_BOX_WIDTH, Math.round(resizeStartWidthRef.current * Math.abs(scaleX)));
      resizeStartWidthRef.current = nextWidth;
      resizePreviewRef.current = {
        boxWidth: nextWidth,
        position: { x: node.x(), y: node.y() },
      };
    }
    node.scaleX(1);
    node.scaleY(1);
    if (resizeFrameRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = null;
    }

    const finalPreview = resizePreviewRef.current;
    if (onResize && finalPreview) {
      onResize(text.id, finalPreview.boxWidth, finalPreview.position);
    }
    setResizePreview(null);
    resizePreviewRef.current = null;
    onResizeStateChange?.(text.id, false);
  };

  const effectiveBgColor = isPrintMode ? undefined : (text.backgroundColor || undefined);
  const effectiveBorderColor = hasChip
    ? (isPrintMode ? '#000000' : (text.borderColor || darkenHex(text.backgroundColor as string, 30)))
    : undefined;
  const borderWidth = text.borderWidth ?? DEFAULT_BORDER_WIDTH;
  const showShadow = !isDragging && !isPrintMode;
  const textAlign = text.textAlign ?? 'left';
  // Auto-fit width normally hugs the content exactly, which makes center/
  // right/justify invisible on single-line text (there's no slack to align
  // within). Give it a little breathing room in that specific case so
  // choosing an alignment is visibly true even before manually stretching
  // the chip. Multiline content already has real width variance across
  // lines and doesn't need this — alignment is naturally visible there.
  const isSingleLine = !text.content.includes('\n');
  const autoAlignPadding = !hasConstrainedWidth && textAlign !== 'left' && isSingleLine ? 32 : 0;
  const boxWidth = hasConstrainedWidth ? constrainedBoxWidth : textSize.width + autoAlignPadding;
  const chipWidth = boxWidth + CHIP_PAD_X * 2;
  const chipHeight = textSize.height + CHIP_PAD_Y * 2;

  // Report the real, final chip box (after auto-fit/manual-width/alignment
  // padding are all applied) so callers can position floating UI (e.g. the
  // format toolbar) against the actual chip instead of duplicating/guessing
  // this sizing logic elsewhere — that guesswork is what made the toolbar
  // drift off/overlap for longer or differently-aligned text before.
  useEffect(() => {
    onMeasure?.(text.id, { width: chipWidth, height: chipHeight });
  }, [text.id, chipWidth, chipHeight, onMeasure]);

  return (
    <Group id={text.id}
      ref={groupRef}
      x={resizePreview?.position.x ?? text.position.x}
      y={resizePreview?.position.y ?? text.position.y}
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
      onTransformStart={handleTransformStart}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
    >
      {/* Chip background + border (Style B). Border alone survives print mode. */}
      {hasChip && (
        <Rect
          x={-CHIP_PAD_X}
          y={-CHIP_PAD_Y}
          width={boxWidth + CHIP_PAD_X * 2}
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
          width={boxWidth + SELECTION_PADDING}
          height={textSize.height + SELECTION_PADDING}
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[4, 4]}
          cornerRadius={4}
          fill="transparent"
          perfectDrawEnabled={false}
        />
      )}

      {/* Hidden measurement node — mirrors the visible node's width/wrap so
          height always reflects the real (possibly word-wrapped) layout. */}
      <Text
        ref={measureRef}
        x={0}
        y={0}
        text={text.content}
        fontSize={text.fontSize}
        fontFamily={text.fontFamily}
        fontStyle={fontStyle}
        lineHeight={LINE_HEIGHT}
        {...boxWidthProps}
        visible={false}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Visible text content. `width` is required for `align` and reflow. */}
      <Text
        x={0}
        y={0}
        width={boxWidth}
        wrap={hasConstrainedWidth ? 'word' : 'none'}
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
    prevProps.text.boxWidth === nextProps.text.boxWidth &&
    prevProps.isPrintMode === nextProps.isPrintMode && // Print mode affects rendering
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.snapEnabled === nextProps.snapEnabled
  );
});

export default TextNode;
