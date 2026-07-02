/**
 * useTextEditController - Controller for inline text and player number editing
 * Handles state, validation, and overlay positioning
 */

import { useState, useCallback, useMemo } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { isTextElement, isPlayerElement } from '@tmc/core';
import type { BoardElement, PlayerElement, TextElement } from '@tmc/core';

export interface UseTextEditControllerOptions {
  elements: BoardElement[];
  getZoom: () => number;

  // canvas layout (needed only for overlay positioning)
  getCanvasRect: () => { width: number; height: number };

  // commands / effects (passed from caller)
  onUpdateText: (id: string, content: string) => void;
  onUpdatePlayerNumber: (id: string, number: number) => void;
  onSelectElement: (id: string) => void;
  /** Ctrl/Cmd+B and Ctrl/Cmd+I while actively editing text — caller looks up
   *  the current bold/italic value and flips it (mirrors onResizeText). */
  onToggleTextFormat?: (id: string, format: 'bold' | 'italic') => void;

  onToast?: (msg: string) => void;
}

export interface TextEditController {
  text: {
    editingId: string | null;
    value: string;
    element: TextElement | null;

    start: (id: string) => void; // starts edit using current element.content
    setValue: (v: string) => void;
    save: () => void;
    cancel: () => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  };

  player: {
    editingId: string | null;
    value: string; // numeric string
    element: PlayerElement | null;

    start: (id: string, currentNumber?: number) => void;
    setValue: (v: string) => void; // caller can sanitize, but hook should also sanitize
    save: () => void;
    cancel: () => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
  };

  // overlay positioning helpers (computed from element + zoom + canvas dims)
  overlay: {
    getTextStyle: () => React.CSSProperties | null;
    getPlayerStyle: () => React.CSSProperties | null;
    /** Generic screen-space position for a given pitch position — used for
     *  floating UI (e.g. the text alignment mini-toolbar) that isn't tied to
     *  the active edit session. */
    getStyleForPosition: (position: { x: number; y: number }, offsetX?: number, offsetY?: number) => React.CSSProperties;
  };
}

export function useTextEditController(opts: UseTextEditControllerOptions): TextEditController {
  const { elements, getZoom, getCanvasRect, onUpdateText, onUpdatePlayerNumber, onSelectElement, onToggleTextFormat, onToast } = opts;

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Player number editing state
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerNumber, setEditingPlayerNumber] = useState<string>('');

  // Derived editing elements
  const editingTextElement = useMemo(() => {
    if (!editingTextId) return null;
    const el = elements.find((e) => e.id === editingTextId);
    return el && isTextElement(el) ? el : null;
  }, [editingTextId, elements]);

  const editingPlayerElement = useMemo(() => {
    if (!editingPlayerId) return null;
    const el = elements.find((e) => e.id === editingPlayerId);
    return el && isPlayerElement(el) ? el : null;
  }, [editingPlayerId, elements]);

  // Text editing handlers
  const startTextEdit = useCallback((id: string) => {
    const el = elements.find((e) => e.id === id);
    if (el && isTextElement(el)) {
      setEditingTextId(id);
      setEditingTextValue(el.content);
    }
  }, [elements]);

  const saveTextEdit = useCallback(() => {
    if (editingTextId && editingTextValue.trim()) {
      onUpdateText(editingTextId, editingTextValue.trim());
    }
    setEditingTextId(null);
    setEditingTextValue('');
  }, [editingTextId, editingTextValue, onUpdateText]);

  const cancelTextEdit = useCallback(() => {
    setEditingTextId(null);
    setEditingTextValue('');
  }, []);

  const handleTextKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      const isCmd = e.metaKey || e.ctrlKey;

      if (isCmd && (e.key === 'b' || e.key === 'B')) {
        // Ctrl/Cmd+B = toggle bold while actively typing — the same
        // convention as any word processor, complementing the Left-arrow
        // toggle available when the text is merely selected (not editing).
        e.preventDefault();
        if (editingTextId) onToggleTextFormat?.(editingTextId, 'bold');
        return;
      }
      if (isCmd && (e.key === 'i' || e.key === 'I')) {
        // Ctrl/Cmd+I = toggle italic while actively typing.
        e.preventDefault();
        if (editingTextId) onToggleTextFormat?.(editingTextId, 'italic');
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        // Enter (no Shift) = save and exit — this is the natural keyboard
        // flow: Enter commits, Shift+Enter adds a line, matching how most
        // single-field text inputs with optional multiline behave.
        e.preventDefault();
        saveTextEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelTextEdit();
      }
      // Shift+Enter = newline (default textarea behavior, no preventDefault).
    },
    [saveTextEdit, cancelTextEdit, editingTextId, onToggleTextFormat]
  );

  // Player number editing handlers
  const startPlayerEdit = useCallback(
    (id: string, currentNumber?: number | undefined) => {
      setEditingPlayerId(id);
      setEditingPlayerNumber(currentNumber !== undefined ? String(currentNumber) : '');
      onSelectElement(id);
    },
    [onSelectElement]
  );

  const savePlayerEdit = useCallback(() => {
    if (editingPlayerId) {
      const trimmed = editingPlayerNumber.trim();
      
      if (!trimmed) {
        // Empty input → remove number
        onSelectElement(editingPlayerId);
        onUpdatePlayerNumber(editingPlayerId, 0); // 0 signals removal (will be converted to undefined in store)
        setEditingPlayerId(null);
        setEditingPlayerNumber('');
        return;
      }
      
      const numValue = parseInt(trimmed, 10);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
        onSelectElement(editingPlayerId);
        onUpdatePlayerNumber(editingPlayerId, numValue);
        if (onToast) {
          onToast(`#${numValue}`);
        }
      }
      // Invalid input (0 or out of range) → cancel edit, keep original number
    }
    setEditingPlayerId(null);
    setEditingPlayerNumber('');
  }, [editingPlayerId, editingPlayerNumber, onSelectElement, onUpdatePlayerNumber, onToast]);

  const cancelPlayerEdit = useCallback(() => {
    setEditingPlayerId(null);
    setEditingPlayerNumber('');
  }, []);

  const setPlayerValue = useCallback((value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setEditingPlayerNumber(digitsOnly);
  }, []);

  const handlePlayerKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        savePlayerEdit();
      } else if (e.key === 'Escape') {
        cancelPlayerEdit();
      }
    },
    [savePlayerEdit, cancelPlayerEdit]
  );

  // Overlay positioning helpers
  const getTextStyle = useCallback((): React.CSSProperties | null => {
    if (!editingTextElement) return null;
    
    const zoom = getZoom();
    const { width: canvasWidth, height: canvasHeight } = getCanvasRect();
    const { x, y } = editingTextElement.position;

    return {
      left: `calc(50% - ${canvasWidth * zoom / 2}px + ${(x + 12) * zoom}px)`,
      top: `calc(50% - ${canvasHeight * zoom / 2}px + ${(y - 4) * zoom}px)`,
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
    };
  }, [editingTextElement, getZoom, getCanvasRect]);

  const getPlayerStyle = useCallback((): React.CSSProperties | null => {
    if (!editingPlayerElement) return null;
    
    const zoom = getZoom();
    const { width: canvasWidth, height: canvasHeight } = getCanvasRect();
    const { x, y } = editingPlayerElement.position;

    return {
      left: `calc(50% - ${canvasWidth * zoom / 2}px + ${x * zoom}px)`,
      top: `calc(50% - ${canvasHeight * zoom / 2}px + ${y * zoom}px)`,
      transform: `scale(${zoom}) translate(-50%, -50%)`,
      transformOrigin: 'center',
    };
  }, [editingPlayerElement, getZoom, getCanvasRect]);

  const getStyleForPosition = useCallback((position: { x: number; y: number }, offsetX = 12, offsetY = -4): React.CSSProperties => {
    const zoom = getZoom();
    const { width: canvasWidth, height: canvasHeight } = getCanvasRect();

    return {
      left: `calc(50% - ${canvasWidth * zoom / 2}px + ${(position.x + offsetX) * zoom}px)`,
      top: `calc(50% - ${canvasHeight * zoom / 2}px + ${(position.y + offsetY) * zoom}px)`,
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
    };
  }, [getZoom, getCanvasRect]);

  return {
    text: {
      editingId: editingTextId,
      value: editingTextValue,
      element: editingTextElement,
      start: startTextEdit,
      setValue: setEditingTextValue,
      save: saveTextEdit,
      cancel: cancelTextEdit,
      onKeyDown: handleTextKeyDown,
    },
    player: {
      editingId: editingPlayerId,
      value: editingPlayerNumber,
      element: editingPlayerElement,
      start: startPlayerEdit,
      setValue: setPlayerValue,
      save: savePlayerEdit,
      cancel: cancelPlayerEdit,
      onKeyDown: handlePlayerKeyDown,
    },
    overlay: {
      getTextStyle,
      getPlayerStyle,
      getStyleForPosition,
    },
  };
}
