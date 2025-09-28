import { ScrollArea } from '@/components/ui/scroll-area';
import { SEO } from '@/components/SEO';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8">
      <SEO
        title="Terms of Service"
        url="https://www.techinterviewnotes.com/terms"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Terms of Service
          </h1>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Last updated: December 2024
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  By accessing and using DevInterview Pro, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  2. Description of Service
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  DevInterview Pro provides digital interview preparation materials including PDF documents, question banks, 
                  and educational content for software developers. Our service is accessible through web browsers and 
                  requires user registration for purchases and downloads.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  3. User Account
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>When creating an account, you agree to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your password</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  4. Payment and Refunds
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p><strong>Payment:</strong> All purchases are processed securely through our payment partners. 
                  Prices are listed in USD and may be subject to local taxes.</p>
                  <p><strong>Refunds:</strong> We offer a 30-day money-back guarantee from the date of purchase. 
                  To request a refund, contact our support team with your order details.</p>
                  <p><strong>Digital Content:</strong> Due to the instant delivery nature of digital products, 
                  refunds are only granted in cases of technical issues or dissatisfaction within the guarantee period.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  5. Intellectual Property
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>All content provided through DevInterview Pro, including but not limited to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Interview questions and answers</li>
                    <li>Educational materials and guides</li>
                    <li>Website design and functionality</li>
                    <li>Logos, trademarks, and branding</li>
                  </ul>
                  <p>are owned by DevInterview Pro or our content partners and are protected by copyright laws. 
                  Unauthorized reproduction, distribution, or commercial use is strictly prohibited.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  6. Permitted Use
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>You may use purchased materials for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Personal interview preparation</li>
                    <li>Educational purposes</li>
                    <li>Individual study and practice</li>
                  </ul>
                  <p><strong>Prohibited uses include:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Sharing or distributing materials to others</li>
                    <li>Commercial redistribution or resale</li>
                    <li>Reverse engineering or copying content</li>
                    <li>Creating derivative works without permission</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  7. Privacy and Data Protection
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your privacy is important to us. Our collection and use of personal information is governed by our 
                  Privacy Policy, which is incorporated into these terms by reference. By using our service, 
                  you consent to the collection and use of your information as outlined in our Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  8. Limitation of Liability
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  DevInterview Pro shall not be liable for any direct, indirect, incidental, special, or consequential damages 
                  resulting from the use or inability to use our service, even if we have been advised of the possibility of such damages. 
                  Our total liability shall not exceed the amount paid by you for the specific service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  9. Service Availability
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  While we strive to maintain continuous service availability, we do not guarantee uninterrupted access. 
                  Scheduled maintenance, technical issues, or circumstances beyond our control may temporarily affect service availability.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  10. Modifications to Terms
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting 
                  on our website. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  11. Termination
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  We may terminate or suspend your account immediately, without prior notice or liability, 
                  for any reason including breach of these terms. Upon termination, your right to use the service ceases immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                  12. Contact Information
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                  <br />
                  Email: legal@devinterview.pro
                  <br />
                  Address: 123 Tech Street, San Francisco, CA 94105
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}