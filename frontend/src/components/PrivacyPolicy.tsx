import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4 max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-sm">
            Last updated: January 1, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <motion.div
          className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="prose prose-gray max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Introduction</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At BeautyCita, we respect your privacy and are committed to protecting your personal information.
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our beauty
                booking platform and related services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                By using BeautyCita, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Information We Collect</h2>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you create an account or book services, we may collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li>Name and contact information (email, phone number)</li>
                <li>Profile information and preferences</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Booking history and service preferences</li>
                <li>Reviews and ratings you provide</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Usage analytics and app performance data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use your personal information to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li>Provide and improve our booking services</li>
                <li>Process payments and manage bookings</li>
                <li>Send important service updates and notifications</li>
                <li>Personalize your experience and recommendations</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>With your consent, send promotional communications</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in these circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li><strong>With Beauty Professionals:</strong> Necessary booking information to provide services</li>
                <li><strong>Service Providers:</strong> Trusted partners who help operate our platform (payment processing, SMS notifications)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
                <li><strong>With Your Consent:</strong> Any other sharing you explicitly authorize</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li>Encrypted data transmission (SSL/TLS)</li>
                <li>Secure payment processing through Stripe</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and employee training</li>
                <li>Secure data storage and backup procedures</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                However, no method of transmission over the internet is 100% secure. While we strive to protect
                your data, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Privacy Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                To exercise these rights, please contact us at privacy@beautycita.com.
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li>Remember your preferences and login status</li>
                <li>Analyze how you use our platform</li>
                <li>Provide personalized recommendations</li>
                <li>Ensure platform security</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                You can control cookies through your browser settings, but this may affect platform functionality.
              </p>
            </section>

            {/* Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Third-Party Services</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our platform integrates with trusted third-party services:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
                <li><strong>Twilio:</strong> SMS notifications (subject to Twilio's privacy policy)</li>
                <li><strong>Google Maps:</strong> Location services (subject to Google's privacy policy)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                These services have their own privacy policies, which we encourage you to review.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                BeautyCita is intended for users 16 years and older. We do not knowingly collect personal
                information from children under 16. If you believe we have collected information from a child
                under 16, please contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws.
                We will notify you of significant changes through email or platform notifications. Your continued use
                of BeautyCita after changes become effective constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="bg-gray-50 rounded-3xl p-4 space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> privacy@beautycita.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +1 (555) 123-4567</p>
                <p className="text-gray-700"><strong>Address:</strong> BeautyCita Privacy Team<br />
                123 Beauty Street, Suite 100<br />
                Los Angeles, CA 90210</p>
              </div>
            </section>

            {/* Legal Compliance */}
            <section className="mb-8">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Legal Compliance</h3>
                <p className="text-blue-700 text-sm">
                  This Privacy Policy complies with applicable privacy laws including GDPR (EU), CCPA (California),
                  and other regional privacy regulations. For specific regional rights and procedures, please
                  contact our privacy team.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="px-4 py-6 max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2025 BeautyCita. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-3">
            <Link to="/terms/client" className="text-gray-500 hover:text-gray-700 text-sm">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-gray-500 hover:text-gray-700 text-sm">
              Contact Us
            </Link>
            <Link to="/about" className="text-gray-500 hover:text-gray-700 text-sm">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy