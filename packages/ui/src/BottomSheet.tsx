/**
 * BottomSheet - Slide-up panel for tablet/mobile
 * Renders via portal to document.body.
 * Supports swipe-down-to-close gesture on drag handle.
 * Uses Design System tokens: animate-slide-up, animate-fade-in, duration-normal.
 */

import React, { useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from './i18n.js';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** maxHeight variant: 'md' → 60vh, 'sm' → 75vh. Default: 'md' */
  maxHeight?: 'md' | 'sm';
}

const SWIPE_CLOSE_THRESHOLD = 60; // px

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  maxHeight = 'md',
}) => {
  const { t } = useTranslation();
  const dragStartYRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - dragStartYRef.current;
    if (deltaY > SWIPE_CLOSE_THRESHOLD) {
      onClose();
      dragStartYRef.current = 0;
    }
  }, [onClose]);

  // Prevent scroll propagation: handle content scroll boundaries
  const handleContentTouchMove = useCallback((_e: React.TouchEvent) => {
    // Don't prevent default — let natural scroll happen.
    // The sheet swipe is handled by the drag handle only.
  }, []);

  if (!isOpen) return null;

  const maxHClass = maxHeight === 'sm' ? 'max-h-[75vh]' : 'max-h-[60vh]';

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-surface rounded-t-2xl shadow-2xl animate-slide-up ${maxHClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('bottomSheet.inspectorPanel')}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
        >
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Close button */}
        <div className="flex justify-end px-4 pb-2 -mt-2">
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface2 text-muted hover:text-text transition-colors duration-fast"
            aria-label={t('bottomSheet.closeInspector')}
            title={t('bottomSheet.close')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 pb-6"
          onTouchMove={handleContentTouchMove}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default BottomSheet;
