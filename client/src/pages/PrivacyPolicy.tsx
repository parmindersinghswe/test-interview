import { ScrollArea } from '@/components/ui/scroll-area';
import { SEO } from '@/components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <SEO title="Privacy Policy" url="https://www.techinterviewnotes.com/privacy" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Last updated: December 2024
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  1. Information We Collect
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p><strong>Personal Information:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Name and email address when you create an account</li>
                    <li>Payment information for purchases (processed securely by our payment partners)</li>
                    <li>Communication data when you contact our support team</li>
                  </ul>
                  <p><strong>Usage Information:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Pages visited and materials accessed</li>
                    <li>Time spent on our platform</li>
                    <li>Download and purchase history</li>
                    <li>Device and browser information</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  2. How We Use Your Information
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>We use your information to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide and maintain our services</li>
                    <li>Process payments and deliver purchased materials</li>
                    <li>Send important updates about your account or purchases</li>
                    <li>Improve our platform and user experience</li>
                    <li>Respond to your questions and provide customer support</li>
                    <li>Prevent fraud and ensure platform security</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  3. Information Sharing
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in these limited circumstances:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> With trusted partners who help us operate our platform (payment processors, hosting providers)</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                    <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                  </ul>
                  <p>All third-party service providers are contractually bound to protect your information and use it only for the services they provide to us.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  4. Data Security
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>We implement appropriate security measures to protect your personal information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>256-bit SSL encryption for all data transmission</li>
                    <li>Secure servers and databases with restricted access</li>
                    <li>Regular security audits and updates</li>
                    <li>Password hashing and secure authentication</li>
                  </ul>
                  <p>While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but use industry-standard practices.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  5. Cookies and Tracking
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Keep you logged in to your account</li>
                    <li>Remember your preferences and settings</li>
                    <li>Analyze site usage and improve our services</li>
                    <li>Provide personalized content recommendations</li>
                  </ul>
                  <p>You can control cookie settings through your browser, but some features may not work properly if cookies are disabled.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  6. Your Rights and Choices
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                    <li><strong>Update:</strong> Correct or update your personal information</li>
                    <li><strong>Delete:</strong> Request deletion of your account and personal data</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                    <li><strong>Portability:</strong> Request your data in a portable format</li>
                  </ul>
                  <p>To exercise these rights, contact us at privacy@devinterview.pro. We will respond within 30 days.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  7. Data Retention
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. 
                  Account information is kept until you request deletion, while purchase records may be retained longer for legal and tax purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  8. International Data Transfers
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your information may be transferred and processed in countries other than your own. We ensure appropriate safeguards are in place 
                  to protect your data according to this privacy policy and applicable laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  9. Children's Privacy
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Our service is intended for users 18 years and older. We do not knowingly collect personal information from children under 18. 
                  If we become aware that we have collected such information, we will delete it promptly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  10. Updates to This Policy
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We may update this privacy policy periodically to reflect changes in our practices or legal requirements. 
                  We will notify you of any material changes by posting the updated policy on our website with a new "last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  11. Contact Us
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  If you have questions about this privacy policy or our data practices, please contact us:
                  <br />
                  Email: privacy@devinterview.pro
                  <br />
                  Address: 123 Tech Street, San Francisco, CA 94105
                  <br />
                  Phone: +1 (555) 123-4567
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}