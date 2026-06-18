/**
 * HelpSidebar - Slide-in panel for help, shortcuts, tools, tips, FAQ, and save status
 * Non-modal — canvas remains interactive when sidebar is open.
 * Positioned fixed at right side, with z-sidebar z-index.
 * Closes on ESC or X button.
 * Has two tabs: Shortcuts & Tips | FAQ / Help Center
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { SHORTCUT_SECTIONS, TOOL_ACTIONS, HELP_TIPS } from './helpSidebarData';
import type { Plan } from './tutorialSteps.js';
import { getFaqForPlan, searchFaq, type FaqCta } from './helpFaqData.js';
import { FaqSearch } from './FaqSearch.js';
import { FaqCategory } from './FaqCategory.js';
import { useTranslation } from './i18n.js';

export type ProjectSaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export type HelpTab = 'shortcuts' | 'faq';

export interface HelpSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callbacks for tool actions */
  onZoomFit?: () => void;
  onToggleFocus?: () => void;
  onTogglePrint?: () => void;
  onExport?: () => void;
  /** Save status display */
  saveStatus?: ProjectSaveStatus;
  hasUnsavedChanges?: boolean;
  onManualSave?: () => void;
  /** Whether print mode is active (hides saving section) */
  isPrintMode?: boolean;
  /** Restart the guided tour */
  onRestartTutorial?: () => void;
  /** User's plan for role-aware FAQ. Defaults to 'guest'. */
  plan?: Plan;
  /** Open pricing modal */
  onOpenPricing?: () => void;
  /** Open team panel */
  onOpenTeamPanel?: () => void;
  /** Open settings */
  onOpenSettings?: () => void;
  /** Open auth/signup modal */
  onOpenAuthModal?: () => void;
}

/** Close icon */
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Save status icons */
const SavedIcon: React.FC = () => (
  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const SavingIcon: React.FC = () => (
  <svg className="w-4 h-4 text-yellow-500 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

/** Section header component */
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{title}</h3>
);

export const HelpSidebar: React.FC<HelpSidebarProps> = ({
  isOpen,
  onClose,
  onZoomFit,
  onToggleFocus,
  onTogglePrint,
  onExport,
  saveStatus,
  hasUnsavedChanges,
  onManualSave,
  isPrintMode = false,
  onRestartTutorial,
  plan = 'guest',
  onOpenPricing,
  onOpenTeamPanel,
  onOpenSettings,
  onOpenAuthModal,
}) => {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<HelpTab>('shortcuts');
  const [faqSearch, setFaqSearch] = useState('');

  // Reset search and tab when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setFaqSearch('');
    }
  }, [isOpen]);

  // Focus close button when sidebar opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // ESC to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle FAQ CTA clicks
  const handleFaqCta = useCallback((cta: FaqCta) => {
    switch (cta.action) {
      case 'pricing': onOpenPricing?.(); break;
      case 'teamPanel': onOpenTeamPanel?.(); break;
      case 'settings': onOpenSettings?.(); break;
      case 'signup': onOpenAuthModal?.(); break;
      case 'save': onManualSave?.(); break;
      case 'export': onExport?.(); break;
    }
  }, [onOpenPricing, onOpenTeamPanel, onOpenSettings, onOpenAuthModal, onManualSave, onExport]);

  // MUST be before early return (Rules of Hooks)
  const faqCategories = React.useMemo(() => {
    const cats = getFaqForPlan(plan);
    return faqSearch ? searchFaq(cats, faqSearch) : cats;
  }, [plan, faqSearch]);

  if (!isOpen) return null;

  const handleToolAction = (action: string) => {
    switch (action) {
      case 'zoomFit': onZoomFit?.(); break;
      case 'toggleFocus': onToggleFocus?.(); break;
      case 'togglePrint': onTogglePrint?.(); break;
      case 'export': onExport?.(); break;
    }
  };

  const saveStatusLabel = saveStatus === 'saving' ? t('help.saving')
    : saveStatus === 'unsaved' || hasUnsavedChanges ? t('help.unsaved')
    : saveStatus === 'error' ? t('help.error')
    : t('help.allSaved');

  const saveStatusIcon = saveStatus === 'saving' ? <SavingIcon />
    : saveStatus === 'error' ? <ErrorIcon />
    : (saveStatus === 'unsaved' || hasUnsavedChanges) ? <SavingIcon />
    : <SavedIcon />;

  return (
    <div
      role="dialog"
      aria-label={t('help.panelLabel')}
      aria-modal="false"
      className="
        fixed top-0 right-0 h-full w-80
        bg-surface border-l border-border
        shadow-2xl
        z-sidebar
        flex flex-col
        animate-slide-in-right
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text">{t('help.title')}</h2>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label={t('help.close')}
          className="p-1.5 rounded-md hover:bg-surface2 text-muted hover:text-text transition-colors"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-border px-4 pt-2 gap-0">
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
            activeTab === 'shortcuts'
              ? 'bg-bg text-text border-l border-t border-r border-border -mb-px'
              : 'text-muted hover:text-text hover:bg-surface2'
          }`}
        >
          {t('help.shortcuts')}
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
            activeTab === 'faq'
              ? 'bg-bg text-text border-l border-t border-r border-border -mb-px'
              : 'text-muted hover:text-text hover:bg-surface2'
          }`}
        >
          ❓ {t('faq.title')}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {activeTab === 'shortcuts' ? (
          <>
            {/* Section 1: Shortcuts */}
            <div>
              <SectionHeader title={t('help.shortcuts')} />
              <div className="space-y-2">
                {SHORTCUT_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-[10px] font-medium text-muted/70 uppercase tracking-wider mb-1">{t(`cheatsheet.sections.${section.title}`)}</h4>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <div key={item.key} className="flex items-center justify-between text-xs">
                          <span className="text-text">{item.id ? t(`shortcuts.${item.id}`) : item.description}</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-surface2 border border-border text-[10px] font-mono text-muted">
                            {item.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Tools */}
            <div>
              <SectionHeader title={t('help.quickTools')} />
              <div className="grid grid-cols-2 gap-2">
                {TOOL_ACTIONS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolAction(tool.action)}
                    title={t(`help.tools.${tool.id}.description`)}
                    className="
                      px-3 py-2 rounded-md
                      bg-surface2 hover:bg-surface
                      border border-border
                      text-xs font-medium text-text
                      transition-colors
                      text-left
                    "
                  >
                    <span className="block">{t(`help.tools.${tool.id}.label`)}</span>
                    <span className="block text-[10px] text-muted mt-0.5">{t(`help.tools.${tool.id}.description`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Tips */}
            <div>
              <SectionHeader title={t('help.tips')} />
              <div className="space-y-2">
                {HELP_TIPS.map((tip) => (
                  <div key={tip.id} className="flex items-start gap-2">
                    <span className="text-accent text-[10px] mt-0.5 flex-shrink-0">💡</span>
                    <p className="text-xs text-text">{t(`help.tipsList.${tip.id}`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Restart Tutorial */}
            <div>
              <SectionHeader title={t('help.tutorial')} />
              <button
                onClick={onRestartTutorial}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-surface2 hover:bg-surface border border-border text-xs text-text transition-colors"
              >
                <span className="text-accent">▶</span>
                <span>{t('help.restartTutorial')}</span>
              </button>
            </div>

            {/* Save Status */}
            {!isPrintMode && (
              <div>
                <SectionHeader title={t('help.saveStatus')} />
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface2">
                  {saveStatusIcon}
                  <span className="text-xs text-text flex-1">{saveStatusLabel}</span>
                  {(saveStatus === 'unsaved' || hasUnsavedChanges || saveStatus === 'error') && (
                    <button
                      onClick={onManualSave}
                      className="text-xs px-2 py-1 rounded bg-accent text-white hover:bg-accent-hover transition-colors"
                    >
                      {t('help.save')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* FAQ Tab */}
            <div>
              <SectionHeader title={t('faq.title')} />
              <p className="text-[11px] text-muted mb-3">{t('faq.subtitle')}</p>

              {/* Search */}
              <div className="mb-3">
                <FaqSearch
                  value={faqSearch}
                  onChange={setFaqSearch}
                  placeholder={t('faq.search')}
                />
              </div>

              {/* Categories */}
              {faqCategories.length > 0 ? (
                <div className="space-y-1">
                  {faqCategories.map((category) => (
                    <FaqCategory
                      key={category.id}
                      category={category}
                      onCtaClick={handleFaqCta}
                      defaultOpen={faqSearch.length > 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted">
                  <p>{t('faq.noResults')}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HelpSidebar;
