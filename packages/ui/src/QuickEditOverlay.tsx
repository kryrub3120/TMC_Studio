/**
 * QuickEditOverlay - Floating input for quick number editing
 * Appears when user double-clicks on a player
 */

import React, { useState, useRef, useEffect } from 'react';

export interface QuickEditOverlayProps {
  /** Currently editing player info */
  editingPlayer: {
    id: string;
    number: number;
    x: number;
    y: number;
  } | null;
  /** Called when edit is confirmed */
  onConfirm: (id: string, newNumber: number) => void;
  /** Called when edit is cancelled */
  onCancel: () => void;
  /** Stage scale for position calculation */
  stageScale?: number;
  /** Stage position offset */
  stagePosition?: { x: number; y: number };
}

export const QuickEditOverlay: React.FC<QuickEditOverlayProps> = ({
  editingPlayer,
  onConfirm,
  onCancel,
  stageScale = 1,
  stagePosition = { x: 0, y: 0 },
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingPlayer) {
      setValue(String(editingPlayer.number));
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [editingPlayer]);

  if (!editingPlayer) return null;

  // Calculate screen position from canvas coordinates
  const screenX = editingPlayer.x * stageScale + stagePosition.x;
  const screenY = editingPlayer.y * stageScale + stagePosition.y;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const num = parseInt(value);
      if (num >= 1 && num <= 99) {
        onConfirm(editingPlayer.id, num);
      } else {
        onCancel();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    const num = parseInt(value);
    if (num >= 1 && num <= 99) {
      onConfirm(editingPlayer.id, num);
    } else {
      onCancel();
    }
  };

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: screenX - 24,
        top: screenY - 16,
      }}
    >
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={99}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-12 h-8 text-center text-lg font-bold bg-surface border-2 border-accent rounded-lg text-text shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
        style={{
          // Remove spinner buttons
          MozAppearance: 'textfield',
        }}
      />
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default QuickEditOverlay;
