/**
 * Footer Component - Collapsible legal links and company info
 * Note: Links use regular <a> tags for compatibility - wrap in Router context when using
 */

interface FooterProps {
  className?: string;
  onNavigate?: (path: string) => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

export function Footer({ className = '', onNavigate, isVisible = true, onToggle }: FooterProps) {
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
          aria-label="Show footer"
        >
          <span>Footer</span>
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
          </div>

          {/* Center - Compact legal links */}
          <div className="hidden sm:flex items-center gap-4">
            <a
              href="/privacy"
              onClick={(e) => handleLinkClick(e, '/privacy')}
              className="hover:text-text transition-colors cursor-pointer"
            >
              Privacy
            </a>
            <a
              href="/terms"
              onClick={(e) => handleLinkClick(e, '/terms')}
              className="hover:text-text transition-colors cursor-pointer"
            >
              Terms
            </a>
            <a
              href="/cookies"
              onClick={(e) => handleLinkClick(e, '/cookies')}
              className="hover:text-text transition-colors cursor-pointer"
            >
              Cookies
            </a>
            <a
              href="mailto:support@tmcstudio.app"
              className="hover:text-text transition-colors"
            >
              Contact
            </a>
            <a
              href="https://github.com/tmcstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

          {/* Right - Toggle button */}
          <button
            onClick={onToggle}
            className="ml-auto sm:ml-0 p-1 hover:bg-surface2 rounded transition-colors"
            aria-label="Hide footer"
            title="Hide footer"
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
