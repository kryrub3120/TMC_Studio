/**
 * TextAlignToolbar - floating mini-toolbar shown above a selected (not
 * editing) text element: bold, italic and alignment. Mouse-friendly
 * counterpart to the Ctrl+B/Ctrl+I/Alt+Left-Right keyboard shortcuts and the
 * context menu entries.
 * No store imports - receives everything via props.
 */

import type { TextAlign } from '@tmc/core';

export interface TextAlignToolbarProps {
  visible: boolean;
  /** Page-absolute pixel position (e.g. from Konva's getClientRect), NOT a
   *  ready-made CSSProperties object — this component owns the fixed
   *  positioning + anchor transform itself. */
  style: { left: number; top: number } | null;
  align: TextAlign;
  onSetAlign: (align: TextAlign) => void;
  bold: boolean;
  italic: boolean;
  onToggleBold: () => void;
  onToggleItalic: () => void;
}

const ALIGN_ICONS: Record<TextAlign, React.ReactNode> = {
  left: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
      <path d="M4 6h16" /><path d="M4 12h10" /><path d="M4 18h13" />
    </svg>
  ),
  center: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
      <path d="M4 6h16" /><path d="M7 12h10" /><path d="M5.5 18h13" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
      <path d="M4 6h16" /><path d="M10 12h10" /><path d="M7 18h13" />
    </svg>
  ),
  justify: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
      <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
    </svg>
  ),
};

const BoldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M6 4h6a4 4 0 0 1 0 8H6z" /><path d="M6 12h7a4 4 0 0 1 0 8H6z" />
  </svg>
);

const ItalicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-4 h-4">
    <path d="M11 4h6" /><path d="M7 20h6" /><path d="M14 4L10 20" />
  </svg>
);

const ALIGN_ORDER: TextAlign[] = ['left', 'center', 'right', 'justify'];
const TOOLBAR_GAP_PX = 14;

export function TextAlignToolbar({
  visible,
  style,
  align,
  onSetAlign,
  bold,
  italic,
  onToggleBold,
  onToggleItalic,
}: TextAlignToolbarProps) {
  if (!visible || !style || typeof document === 'undefined') return null;

  // Keep this in BoardPage's overlay tree instead of portaling to <body>.
  // During Vite hot updates the body portal could leave a stale toolbar behind,
  // which looked like a double render. This component is already rendered as a
  // sibling of the transformed canvas shell, so fixed viewport coordinates are
  // stable without a portal.
  return (
    <div
      className="fixed z-floating pointer-events-auto animate-fade-in"
      style={{ left: style.left, top: style.top, transform: `translate(-50%, calc(-100% - ${TOOLBAR_GAP_PX}px))` }}
    >
      <div className="flex items-center gap-0.5 px-1 py-0.5 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-lg">
        <button
          type="button"
          onClick={onToggleBold}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded-md transition-colors ${
            bold ? 'text-accent bg-surface2' : 'text-muted hover:text-text hover:bg-surface2'
          }`}
        >
          <BoldIcon />
        </button>
        <button
          type="button"
          onClick={onToggleItalic}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded-md transition-colors ${
            italic ? 'text-accent bg-surface2' : 'text-muted hover:text-text hover:bg-surface2'
          }`}
        >
          <ItalicIcon />
        </button>

        <div className="w-px h-5 bg-border mx-0.5" />

        {ALIGN_ORDER.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onSetAlign(a)}
            title={a}
            className={`p-1.5 rounded-md transition-colors ${
              align === a
                ? 'text-accent bg-surface2'
                : 'text-muted hover:text-text hover:bg-surface2'
            }`}
          >
            {ALIGN_ICONS[a]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TextAlignToolbar;
