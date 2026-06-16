import { useTranslation } from './i18n.js';
/**
 * Footer Component - Collapsible legal links and company info
 * Note: Links use regular <a> tags for compatibility - wrap in Router context when using
 */

interface FooterProps {
  className?: string;
  /** App version shown next to the copyright (e.g. '0.5.0'). */
  version?: string;
  onNavigate?: (path: string) => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

export function Footer({ className = '', version, onNavigate, isVisible = true, onToggle }: FooterProps) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  // Hidden state - show only minimal trigger
  if (!isVisible) {
    return (
      <div className={`fixed bottom-0 right-4 z-40 ${className}`}>
        <button
          onClick={onToggle}
          className="px-3 py-1 text-xs text-muted hover:text-text bg-surface/80 backdrop-blur-sm border border-border/50 rounded-t-md transition-all hover:bg-surface shadow-sm flex items-center gap-1"
          aria-label={t('footer.show')}
        >
          <span>{t('footer.label')}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // Visible state - compact single line
  return (
    <footer className={`bg-surface border-t border-border ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted">
          {/* Left - Branding */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">TMC Studio</span>
            <span>© {currentYear}</span>
            {version && <span className="opacity-70">v{version}</span>}
          </div>

          {/* Center - Compact legal links */}
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="/download"
              onClick={(e) => handleLinkClick(e, '/download')}
              className="text-accent hover:text-accent-hover font-medium transition-colors cursor-pointer"
            >
              {t('footer.download')}
            </a>
            <a
              href="/privacy"
              onClick={(e) => handleLinkClick(e, '/privacy')}
              className="hover:text-text transition-colors cursor-pointer"
            >
              {t('footer.privacy')}
            </a>
            <a
              href="/terms"
              onClick={(e) => handleLinkClick(e, '/terms')}
              className="hover:text-text transition-colors cursor-pointer"
            >
              {t('footer.terms')}
            </a>
            <a
              href="/cookies"
              onClick={(e) => handleLinkClick(e, '/cookies')}
              className="hover:text-text transition-colors cursor-pointer"
            >
              {t('footer.cookies')}
            </a>
            <a
              href="mailto:support@tmcstudio.app"
              className="hover:text-text transition-colors"
            >
              {t('footer.contact')}
            </a>
            <a
              href="https://x.com/tmcstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
              aria-label={t('footer.social.x')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/tmcstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
              aria-label={t('footer.social.linkedin')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>

          {/* Right - Toggle button */}
          <button
            onClick={onToggle}
            className="ml-auto sm:ml-0 p-1 hover:bg-surface2 rounded transition-colors"
            aria-label={t('footer.hide')}
            title={t('footer.hide')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
