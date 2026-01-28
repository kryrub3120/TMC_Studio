/**
 * BoardEditOverlays - Presentational components for text and player number editing
 * No store imports - receives everything via props
 */

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface BoardEditOverlaysProps {
  text: {
    elementExists: boolean;
    value: string;
    onChange: (v: string) => void;
    onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
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

  return (
    <>
      {/* Text editing overlay */}
      {text.elementExists && text.style && (
        <div
          className="absolute pointer-events-auto"
          style={text.style}
        >
          <input
            type="text"
            value={text.value}
            onChange={(e) => text.onChange(e.target.value)}
            onKeyDown={text.onKeyDown}
            onBlur={text.onBlur}
            autoFocus
            className="px-2 py-1 bg-surface border border-accent rounded text-white text-base min-w-[100px] outline-none shadow-lg"
            style={text.inputStyle ?? undefined}
          />
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
