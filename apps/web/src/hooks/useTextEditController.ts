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

    start: (id: string, currentNumber: number) => void;
    setValue: (v: string) => void; // caller can sanitize, but hook should also sanitize
    save: () => void;
    cancel: () => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
  };

  // overlay positioning helpers (computed from element + zoom + canvas dims)
  overlay: {
    getTextStyle: () => React.CSSProperties | null;
    getPlayerStyle: () => React.CSSProperties | null;
  };
}

export function useTextEditController(opts: UseTextEditControllerOptions): TextEditController {
  const { elements, getZoom, getCanvasRect, onUpdateText, onUpdatePlayerNumber, onSelectElement, onToast } = opts;

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
      if (e.key === 'Enter' && !e.shiftKey) {
        // Enter without Shift = save
        e.preventDefault();
        saveTextEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelTextEdit();
      }
      // Shift+Enter = add newline (default textarea behavior, no preventDefault)
    },
    [saveTextEdit, cancelTextEdit]
  );

  // Player number editing handlers
  const startPlayerEdit = useCallback(
    (id: string, currentNumber: number) => {
      setEditingPlayerId(id);
      setEditingPlayerNumber(String(currentNumber));
      onSelectElement(id);
    },
    [onSelectElement]
  );

  const savePlayerEdit = useCallback(() => {
    if (editingPlayerId && editingPlayerNumber.trim()) {
      const numValue = parseInt(editingPlayerNumber.trim(), 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
        onSelectElement(editingPlayerId);
        onUpdatePlayerNumber(editingPlayerId, numValue);
        if (onToast) {
          onToast(`#${numValue}`);
        }
      }
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
    },
  };
}
