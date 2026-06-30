/**
 * FloatingHelpButton - Large floating action button for opening HelpSidebar
 * Positioned fixed at bottom-right corner.
 * Uses z-floating token from design system.
 * Hidden in print mode.
 */

import React from 'react';
import { useTranslation } from './i18n.js';

export interface FloatingHelpButtonProps {
  onClick: () => void;
  isPrintMode?: boolean;
}

/** Help/Question icon */
const HelpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({
  onClick,
  isPrintMode = false,
}) => {
  const { t } = useTranslation();
  if (isPrintMode) return null;

  return (
    <button
      onClick={onClick}
      aria-label={t('help.title')}
      title={`${t('help.title')} (?)`}
      className="
        absolute bottom-4 left-4
        w-12 h-12 sm:w-14 sm:h-14
        bg-accent hover:bg-accent-hover
        text-white
        rounded-full
        shadow-lg
        flex items-center justify-center
        transition-all duration-fast
        hover:scale-110 active:scale-95
        z-floating
        focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-bg
      "
    >
      <HelpIcon className="w-6 h-6 sm:w-7 sm:h-7" />
    </button>
  );
};

export default FloatingHelpButton;
