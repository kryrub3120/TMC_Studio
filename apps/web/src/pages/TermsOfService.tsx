/**
 * Terms of Service Page
 */

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted">Last updated: January 10, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted leading-relaxed">
              By accessing and using TMC Studio ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted leading-relaxed">
              TMC Studio is a web-based tactical board application for sports coaches and analysts. The Service allows users to create, edit, and share tactical diagrams, formations, and animated sequences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">3.1 Registration</h3>
            <p className="text-muted leading-relaxed">
              To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">3.2 Account Security</h3>
            <p className="text-muted leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">3.3 Account Termination</h3>
            <p className="text-muted leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Subscription and Payments</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">4.1 Pricing</h3>
            <p className="text-muted leading-relaxed">
              We offer both free and paid subscription plans. Pricing is displayed on our website and may be changed with 30 days notice.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">4.2 Billing</h3>
            <p className="text-muted leading-relaxed">
              Paid subscriptions are billed monthly or annually in advance. Payments are processed securely through Stripe.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">4.3 Refunds</h3>
            <p className="text-muted leading-relaxed">
              We offer a 14-day money-back guarantee for first-time subscribers. Refunds after this period are at our discretion.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">4.4 Cancellation</h3>
            <p className="text-muted leading-relaxed">
              You may cancel your subscription at any time. Cancellations take effect at the end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. User Content</h2>
            <h3 className="text-xl font-medium mb-2 mt-4">5.1 Ownership</h3>
            <p className="text-muted leading-relaxed">
              You retain all rights to the tactical boards and content you create using our Service. We do not claim ownership of your user content.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">5.2 License</h3>
            <p className="text-muted leading-relaxed">
              By using our Service, you grant us a limited license to host, store, and display your content solely for the purpose of providing the Service to you.
            </p>

            <h3 className="text-xl font-medium mb-2 mt-4">5.3 Prohibited Content</h3>
            <p className="text-muted leading-relaxed mb-2">You agree not to upload or share content that:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Violates any laws or regulations</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains malware or harmful code</li>
              <li>Is offensive, harassing, or discriminatory</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Acceptable Use</h2>
            <p className="text-muted leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use automated tools to access the Service (bots, scrapers)</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Share your account with others</li>
              <li>Use the Service for any illegal purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-muted leading-relaxed">
              The Service, including its software, design, graphics, and content (excluding user content), is owned by TMC Studio and protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Disclaimers</h2>
            <p className="text-muted leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-muted leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TMC Studio shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Data Backup</h2>
            <p className="text-muted leading-relaxed">
              While we implement backup procedures, you are responsible for maintaining your own backups of your content. We are not liable for data loss.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Changes to Terms</h2>
            <p className="text-muted leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the Service constitutes acceptance of modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Governing Law</h2>
            <p className="text-muted leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact Information</h2>
            <p className="text-muted leading-relaxed">
              If you have any questions about these Terms, please contact us at:{' '}
              <a href="mailto:legal@tmcstudio.app" className="text-accent hover:underline">
                legal@tmcstudio.app
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
