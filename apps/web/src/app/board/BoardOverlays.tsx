/**
 * BoardOverlays - Text edit, number edit, context menu overlays
 */

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { isTextElement, isPlayerElement } from '@tmc/core';
import type { BoardElement } from '@tmc/core';
import { ContextMenu, type ContextMenuItem } from '@tmc/ui';

// Text Edit Overlay
export interface TextEditOverlayProps {
  editingTextElement: BoardElement | null | undefined;
  editingTextValue: string;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onTextChange: (value: string) => void;
  onTextSave: () => void;
  onTextCancel: () => void;
}

export function TextEditOverlay(props: TextEditOverlayProps) {
  const {
    editingTextElement,
    editingTextValue,
    zoom,
    canvasWidth,
    canvasHeight,
    onTextChange,
    onTextSave,
    onTextCancel,
  } = props;

  if (!editingTextElement || !isTextElement(editingTextElement)) return null;

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onTextSave();
    } else if (e.key === 'Escape') {
      onTextCancel();
    }
  };

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `calc(50% - ${canvasWidth * zoom / 2}px + ${(editingTextElement.position.x + 12) * zoom}px)`,
        top: `calc(50% - ${canvasHeight * zoom / 2}px + ${(editingTextElement.position.y - 4) * zoom}px)`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
    >
      <input
        type="text"
        value={editingTextValue}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onTextSave}
        autoFocus
        className="px-2 py-1 bg-surface border border-accent rounded text-white text-base min-w-[100px] outline-none shadow-lg"
        style={{
          fontSize: editingTextElement.fontSize,
          fontWeight: editingTextElement.bold ? 'bold' : 'normal',
          fontFamily: editingTextElement.fontFamily,
        }}
      />
    </div>
  );
}

// Player Number Edit Overlay
export interface PlayerNumberEditOverlayProps {
  editingPlayerElement: BoardElement | null | undefined;
  editingPlayerNumber: string;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onNumberChange: (value: string) => void;
  onNumberSave: () => void;
  onNumberCancel: () => void;
}

export function PlayerNumberEditOverlay(props: PlayerNumberEditOverlayProps) {
  const {
    editingPlayerElement,
    editingPlayerNumber,
    zoom,
    canvasWidth,
    canvasHeight,
    onNumberChange,
    onNumberSave,
    onNumberCancel,
  } = props;

  if (!editingPlayerElement || !isPlayerElement(editingPlayerElement)) return null;

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onNumberSave();
    } else if (e.key === 'Escape') {
      onNumberCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    onNumberChange(val);
  };

  return (
    <div
      className="absolute pointer-events-auto z-50"
      style={{
        left: `calc(50% - ${canvasWidth * zoom / 2}px + ${editingPlayerElement.position.x * zoom}px)`,
        top: `calc(50% - ${canvasHeight * zoom / 2}px + ${editingPlayerElement.position.y * zoom}px)`,
        transform: `scale(${zoom}) translate(-50%, -50%)`,
        transformOrigin: 'center',
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={editingPlayerNumber}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onNumberSave}
        autoFocus
        className="w-12 h-10 text-center bg-surface border-2 border-accent rounded-lg text-white text-xl font-bold outline-none shadow-lg"
      />
    </div>
  );
}

// Canvas Context Menu
export interface CanvasContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  header?: string;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function CanvasContextMenuOverlay(props: CanvasContextMenuProps) {
  const { visible, x, y, header, items, onClose } = props;

  if (!visible) return null;

  return (
    <ContextMenu
      x={x}
      y={y}
      header={header}
      items={items}
      onClose={onClose}
    />
  );
}

// Focus Mode Exit Bar
export interface FocusModeExitBarProps {
  focusMode: boolean;
  onExitFocusMode: () => void;
}

export function FocusModeExitBar(props: FocusModeExitBarProps) {
  const { focusMode, onExitFocusMode } = props;

  if (!focusMode) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-2 z-50 group"
    >
      <div className="absolute inset-x-0 top-0 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-surface/95 backdrop-blur-sm border-b border-border">
        <button
          onClick={onExitFocusMode}
          className="px-3 py-1 text-sm text-muted hover:text-text rounded-md hover:bg-surface2 transition-colors"
        >
          Exit Focus Mode
        </button>
      </div>
    </div>
  );
}
