/**
 * FaqItem - Single FAQ question with expandable answer
 * Role-aware: can show a CTA button for upgrade/signup actions
 */

import React, { useState } from 'react';
import type { FaqItem as FaqItemData, FaqCta } from './helpFaqData.js';
import { useTranslation } from './i18n.js';

export interface FaqItemProps {
  item: FaqItemData;
  onCtaClick?: (cta: FaqCta) => void;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const FaqItem: React.FC<FaqItemProps> = ({ item, onCtaClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs text-text hover:bg-surface2 transition-colors"
        aria-expanded={isOpen}
        aria-label={t(item.questionKey)}
      >
        <span className="flex-1 font-medium">{t(item.questionKey)}</span>
        <ChevronIcon open={isOpen} />
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1 text-xs text-muted leading-relaxed space-y-2 border-t border-border">
          <p>{t(item.answerKey)}</p>
          {item.cta && onCtaClick && (
            <button
              onClick={() => onCtaClick(item.cta!)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-accent text-[#062016] text-[11px] font-semibold hover:bg-accent-hover transition-colors"
            >
              {t(item.cta.labelKey)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FaqItem;