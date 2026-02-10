/**
 * OfflineBanner - PR-L5-MINI
 * Shows a subtle non-blocking banner when offline
 */

import React from 'react';

export interface OfflineBannerProps {
  isVisible: boolean;
}

/** Offline icon */
const WifiOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

/**
 * OfflineBanner component
 * Displays a non-blocking banner when user is offline
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-12 left-0 right-0 z-[45] flex justify-center pointer-events-none">
      <div className="bg-red-500/90 text-white px-4 py-2 rounded-b-lg shadow-lg flex items-center gap-2 text-sm font-medium pointer-events-auto">
        <WifiOffIcon className="w-4 h-4" />
        <span>You are offline — changes will sync when back online</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
