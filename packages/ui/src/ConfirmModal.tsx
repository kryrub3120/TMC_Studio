/**
 * ConfirmModal - Reusable Confirmation Dialog
 * TMC Studio - Replaces window.confirm() with proper modal UX
 * 
 * H3 Checklist compliance:
 * - ESC = cancel
 * - Backdrop click = cancel
 * - ENTER = confirm (unless in input/textarea)
 * - Focus trap with Tab cycling
 * - Focus management: danger=true → Cancel, danger=false → Confirm
 * - Focus return after close
 * - Double-click protection
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Handle confirm with double-click protection
  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm();
      // Note: modal will close via state update from parent
    } catch (error) {
      console.error('[ConfirmModal] Confirm action failed:', error);
      setIsSubmitting(false);
    }
  }, [isSubmitting, onConfirm]);

  // ESC/ENTER key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // ESC always cancels
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      
      // ENTER confirms, but only if not in input/textarea
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return; // Don't interfere with input fields
        }
        e.preventDefault();
        handleConfirm();
        return;
      }

      // Tab trap (cycle focus within modal)
      if (e.key === 'Tab') {
        const cancelBtn = cancelButtonRef.current;
        const confirmBtn = confirmButtonRef.current;
        
        if (!cancelBtn || !confirmBtn) return;

        if (e.shiftKey) {
          // Shift+Tab
          if (document.activeElement === cancelBtn) {
            e.preventDefault();
            confirmBtn.focus();
          }
        } else {
          // Tab
          if (document.activeElement === confirmBtn) {
            e.preventDefault();
            cancelBtn.focus();
          }
        }
      }
    },
    [onCancel, handleConfirm]
  );

  // Focus management and cleanup
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      // Set initial focus based on danger state
      // danger=true -> focus Cancel (safer default)
      // danger=false -> focus Confirm (common action)
      setTimeout(() => {
        if (danger && cancelButtonRef.current) {
          cancelButtonRef.current.focus();
        } else if (!danger && confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 50);
      
      // Add event listeners
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        
        // Restore focus on unmount
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, danger, handleKeyDown]);

  // Reset submitting state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-white/10">
        {/* Content */}
        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            {danger && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">
                {title}
              </h2>
              {description && (
                <p className="mt-2 text-sm text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                danger
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
