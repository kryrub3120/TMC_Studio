/**
 * Privacy Policy Page
 */

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted">Last updated: January 10, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted leading-relaxed">
              TMC Studio ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our tactical board application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Account information (email, name)</li>
              <li>Project data (tactical boards, formations, annotations)</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Usage data and analytics</li>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Provide and maintain our service</li>
              <li>Process your payments and subscriptions</li>
              <li>Send you updates and notifications</li>
              <li>Improve our application and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Security</h2>
            <p className="text-muted leading-relaxed">
              Your data is stored securely using Supabase (PostgreSQL database) with encryption at rest and in transit. We implement industry-standard security measures to protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted leading-relaxed">
              We do not sell your personal information. We may share your data with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Stripe</strong> - for payment processing</li>
              <li><strong>Supabase</strong> - for data hosting and authentication</li>
              <li><strong>Netlify</strong> - for application hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-muted leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookies</h2>
            <p className="text-muted leading-relaxed">
              We use essential cookies for authentication and preference storage. You can control cookies through your browser settings. See our <a href="/cookies" className="text-accent hover:underline">Cookie Policy</a> for more details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-muted leading-relaxed">
              Our service is not intended for children under 13. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:{' '}
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
