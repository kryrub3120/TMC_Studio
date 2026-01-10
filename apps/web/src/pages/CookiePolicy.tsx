/**
 * Cookie Policy Page
 */

export function CookiePolicy() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-muted">Last updated: January 10, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. What Are Cookies?</h2>
            <p className="text-muted leading-relaxed">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. How We Use Cookies</h2>
            <p className="text-muted leading-relaxed">
              TMC Studio uses cookies for the following purposes:
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-medium mb-2 mt-4">3.1 Essential Cookies</h3>
            <p className="text-muted leading-relaxed mb-2">
              These cookies are necessary for the Service to function properly. They cannot be disabled.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Authentication</strong> - Keeps you signed in to your account</li>
              <li><strong>Session Management</strong> - Maintains your session while you use the app</li>
              <li><strong>Security</strong> - Protects against CSRF attacks and ensures secure communication</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">3.2 Preference Cookies</h3>
            <p className="text-muted leading-relaxed mb-2">
              These cookies remember your settings and preferences:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Theme</strong> - Remembers your dark/light mode preference</li>
              <li><strong>Language</strong> - Stores your language selection</li>
              <li><strong>UI Settings</strong> - Saves inspector panel state, zoom level, etc.</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">3.3 Analytics Cookies (Optional)</h3>
            <p className="text-muted leading-relaxed mb-2">
              These cookies help us understand how visitors use our Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Usage Patterns</strong> - Which features are most popular</li>
              <li><strong>Performance</strong> - How fast pages load</li>
              <li><strong>Error Tracking</strong> - Identifies technical issues</li>
            </ul>
            <p className="text-muted text-sm mt-2">
              Note: We currently do not use analytics cookies, but may implement them in the future.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Third-Party Cookies</h2>
            <p className="text-muted leading-relaxed mb-2">
              We use the following third-party services that may set cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Supabase</strong> - For authentication and data storage</li>
              <li><strong>Stripe</strong> - For secure payment processing</li>
            </ul>
            <p className="text-muted leading-relaxed mt-3">
              These services have their own privacy and cookie policies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted mt-2">
              <li><a href="https://supabase.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></li>
              <li><a href="https://stripe.com/privacy" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Local Storage</h2>
            <p className="text-muted leading-relaxed">
              In addition to cookies, we use browser local storage to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Cache your tactical boards for offline access</li>
              <li>Store application state between sessions</li>
              <li>Remember your last edited project</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Managing Cookies</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">6.1 Browser Controls</h3>
            <p className="text-muted leading-relaxed">
              Most browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Block all cookies</li>
              <li>Block third-party cookies only</li>
              <li>Delete cookies after each session</li>
              <li>View and delete specific cookies</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">6.2 Impact of Blocking Cookies</h3>
            <p className="text-muted leading-relaxed">
              ⚠️ <strong>Important:</strong> If you block essential cookies, you will not be able to sign in or use cloud features. Preference cookies can be blocked with minimal impact on functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookie Duration</h2>
            <div className="space-y-3 text-muted">
              <div className="p-3 bg-surface rounded-lg">
                <strong>Session Cookies</strong> - Deleted when you close your browser
              </div>
              <div className="p-3 bg-surface rounded-lg">
                <strong>Persistent Cookies</strong> - Remain for up to 1 year, or until you delete them
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Updates to This Policy</h2>
            <p className="text-muted leading-relaxed">
              We may update this Cookie Policy from time to time. We will notify you of any significant changes by updating the "Last updated" date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-muted leading-relaxed">
              If you have questions about our use of cookies, please contact us at:{' '}
              <a href="mailto:privacy@tmcstudio.app" className="text-accent hover:underline">
                privacy@tmcstudio.app
              </a>
            </p>
          </section>
        </div>

        {/* Back to App */}
        <div className="mt-12 pt-8 border-t border-border">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:underline"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to TMC Studio
          </a>
        </div>
      </div>
    </div>
  );
}
