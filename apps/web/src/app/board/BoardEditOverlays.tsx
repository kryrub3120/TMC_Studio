/**
 * BoardEditOverlays - Presentational components for text and player number editing
 * No store imports - receives everything via props
 */

import { useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useAutosizeTextarea } from '../../hooks/useAutosizeTextarea';

export interface BoardEditOverlaysProps {
  text: {
    elementExists: boolean;
    value: string;
    onChange: (v: string) => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
    onBlur: () => void;
    style: React.CSSProperties | null;
    inputStyle: React.CSSProperties | null; // font style for text
  };
  player: {
    elementExists: boolean;
    value: string;
    onChange: (v: string) => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    style: React.CSSProperties | null;
  };
}

export function BoardEditOverlays(props: BoardEditOverlaysProps) {
  const { text, player } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [hintVisible, setHintVisible] = useState(true);

  useAutosizeTextarea(textareaRef, mirrorRef, text.value);

  return (
    <>
      {/* Text editing overlay */}
      {text.elementExists && text.style && (
        <div
          className="absolute pointer-events-auto"
          style={text.style}
        >
          <textarea
            ref={textareaRef}
            value={text.value}
            onChange={(e) => text.onChange(e.target.value)}
            onKeyDown={(e) => {
              if (hintVisible) setHintVisible(false);
              text.onKeyDown(e);
            }}
            onBlur={text.onBlur}
            autoFocus
            rows={1}
            className="px-2 py-1 bg-surface border border-accent rounded text-white text-base min-w-[100px] outline-none shadow-lg resize-none overflow-hidden"
            style={text.inputStyle ?? undefined}
          />
          {/* Hidden mirror for width auto-sizing — shares font metrics with the textarea above */}
          <span
            ref={mirrorRef}
            aria-hidden="true"
            className="px-2 py-1 text-base"
            style={{
              ...(text.inputStyle ?? undefined),
              position: 'absolute',
              visibility: 'hidden',
              whiteSpace: 'pre',
              pointerEvents: 'none',
              top: 0,
              left: 0,
            }}
          >
            {text.value || ' '}
          </span>
          {hintVisible && (
            <div className="absolute left-0 top-full mt-1 whitespace-nowrap text-[11px] text-muted bg-surface/90 border border-border rounded px-1.5 py-0.5 pointer-events-none">
              Enter = nowa linia · kliknij poza = zapisz
            </div>
          )}
        </div>
      )}

      {/* Player number edit overlay */}
      {player.elementExists && player.style && (
        <div
          className="absolute pointer-events-auto z-50"
          style={player.style}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={player.value}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              player.onChange(val);
            }}
            onKeyDown={player.onKeyDown}
            onBlur={player.onBlur}
            autoFocus
            className="w-12 h-10 text-center bg-surface border-2 border-accent rounded-lg text-white text-xl font-bold outline-none shadow-lg"
          />
        </div>
      )}
    </>
  );
}
