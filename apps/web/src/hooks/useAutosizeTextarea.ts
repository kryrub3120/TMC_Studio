/**
 * useAutosizeTextarea - grows/shrinks a textarea (height) and mirrors its
 * widest line (width) so the inline text editor visually tracks the final
 * Konva-rendered chip as closely as practical (WYSIWYG-ish).
 *
 * Height: standard scrollHeight reset trick.
 * Width: measured off a hidden sibling <span> (mirrorRef) that shares the
 * textarea's font metrics and renders the same value with `white-space: pre`,
 * so its natural (unwrapped) width reflects the longest line.
 */

import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

export interface UseAutosizeTextareaOptions {
  minWidth?: number;
  maxWidth?: number;
}

export function useAutosizeTextarea(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  mirrorRef: RefObject<HTMLSpanElement | null>,
  value: string,
  opts?: UseAutosizeTextareaOptions
) {
  const minWidth = opts?.minWidth ?? 60;
  const maxWidth = opts?.maxWidth ?? 480;

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Height: reset then grow to content.
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;

    // Width: mirror span reports the widest unwrapped line.
    const mirror = mirrorRef.current;
    if (mirror) {
      const contentWidth = mirror.scrollWidth + 4; // small caret/edge buffer
      const clamped = Math.min(maxWidth, Math.max(minWidth, contentWidth));
      el.style.width = `${clamped}px`;
    }
    // textareaRef/mirrorRef are stable DOM refs; only re-run when content
    // affecting the measured size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minWidth, maxWidth]);
}
