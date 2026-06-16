/**
 * FaqCategory - Collapsible FAQ category with header and items list
 * Shows category icon, title, and item count
 */

import React, { useState } from 'react';
import type { FaqCategory as FaqCategoryData, FaqCta } from './helpFaqData.js';
import { FaqItem } from './FaqItem.js';
import { useTranslation } from './i18n.js';

export interface FaqCategoryProps {
  category: FaqCategoryData;
  onCtaClick?: (cta: FaqCta) => void;
  defaultOpen?: boolean;
}

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const FaqCategory: React.FC<FaqCategoryProps> = ({
  category,
  onCtaClick,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { t } = useTranslation();

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-1 py-1.5 text-xs font-semibold text-text hover:text-accent transition-colors"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[14px]">{category.icon}</span>
          <span>{t(category.titleKey)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted/60 font-normal">{category.items.length}</span>
          <ChevronIcon open={isOpen} />
        </span>
      </button>
      {isOpen && (
        <div className="ml-1 mt-1 space-y-1">
          {category.items.map((item) => (
            <FaqItem key={item.id} item={item} onCtaClick={onCtaClick} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FaqCategory;