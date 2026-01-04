/**
 * ToastHint - Brief notification toast for tool/mode hints
 * Shows for ~1.2s when user activates a tool
 */

import React from 'react';

export interface ToastHintProps {
  message: string | null;
}

/** ToastHint Component */
export const ToastHint: React.FC<ToastHintProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-toast pointer-events-none">
      <div className="animate-toast bg-surface/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-4 py-2">
        <p className="text-sm text-text whitespace-nowrap">
          {message}
        </p>
      </div>
    </div>
  );
};

export default ToastHint;
