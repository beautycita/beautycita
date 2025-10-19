import React from 'react'
import { Link } from 'react-router-dom'

const ClientTerms: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffeef8, #f0e6ff)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <Link
            to="/"
            style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              marginBottom: '20px'
            }}
          >
            ← Back to Home
          </Link>
          <h1 style={{
            fontSize: '32px',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Client Terms of Service
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Effective Date: January 1, 2025
          </p>
        </div>

        {/* Content */}
        <div style={{
          lineHeight: '1.6',
          color: '#333'
        }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p>
              By creating an account and using BeautyCita's services, you agree to be bound by these Terms of Service ("Terms").
              These Terms constitute a legally binding agreement between you ("Client," "you," or "your") and BeautyCita ("we," "us," or "our").
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>2. Service Description</h2>
            <p>
              BeautyCita is a platform that connects clients with licensed beauty professionals ("Stylists") for beauty services including
              but not limited to hair styling, makeup, nail care, and other beauty treatments. We facilitate bookings but do not provide
              beauty services directly.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>3. Account Registration</h2>
            <p>To use our services, you must:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Be at least 18 years old or have parental consent</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized account access</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>4. Booking and Payment</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>4.1 Booking Process</h3>
              <p>
                All bookings are subject to stylist availability and confirmation. Booking confirmation does not guarantee service completion.
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>4.2 Payment</h3>
              <p>
                Payment is processed through our secure payment system. You authorize us to charge your selected payment method for
                all services booked through the platform.
              </p>
            </div>
            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>4.3 Pricing</h3>
              <p>
                Service prices are set by individual stylists. All prices include applicable taxes and BeautyCita service fees.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>5. Cancellation and Refund Policy</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>5.1 Client Cancellations</h3>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li><strong>24+ hours before appointment:</strong> Full refund</li>
                <li><strong>6-24 hours before appointment:</strong> 50% refund</li>
                <li><strong>Less than 6 hours:</strong> No refund</li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>5.2 Stylist Cancellations</h3>
              <p>
                If a stylist cancels your appointment, you will receive a full refund and may be offered rebooking priority.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>6. Client Responsibilities</h2>
            <p>As a client, you agree to:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Arrive on time for scheduled appointments</li>
              <li>Provide accurate information about allergies, skin sensitivities, or medical conditions</li>
              <li>Treat stylists with respect and professionalism</li>
              <li>Follow health and safety guidelines</li>
              <li>Report any issues or concerns promptly</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>7. Health and Safety</h2>
            <p>
              You acknowledge that beauty services may carry inherent risks. You agree to inform your stylist of any allergies,
              medical conditions, or sensitivities that could affect the service. BeautyCita is not liable for adverse reactions
              to services when proper disclosure was not made.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>8. Privacy and Data</h2>
            <p>
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy,
              which is incorporated by reference into these Terms. We use Aphrodite AI technology to enhance your experience
              through personalized recommendations.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>9. Dispute Resolution</h2>
            <p>
              For service-related disputes, we encourage direct communication with your stylist first. If unresolved, contact
              our support team. Disputes not resolved through our platform may be subject to binding arbitration in accordance
              with the rules of the American Arbitration Association.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>10. Limitation of Liability</h2>
            <p>
              BeautyCita acts as an intermediary platform. We are not liable for the quality, safety, or legality of services
              provided by stylists. Our liability is limited to the amount paid for the specific service in question.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>11. Intellectual Property</h2>
            <p>
              All content on the BeautyCita platform, including but not limited to text, graphics, logos, and software,
              is the property of BeautyCita or its licensors and is protected by copyright and other intellectual property laws.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>12. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Significant changes will be communicated via email or
              platform notification. Continued use of our services after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>13. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. We reserve the right to suspend or terminate accounts
              that violate these Terms or engage in fraudulent activity.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the jurisdiction where BeautyCita is incorporated, without regard to
              conflict of law principles.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>15. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <p style={{ margin: 0 }}>
                <strong>BeautyCita Support</strong><br />
                Email: legal@beautycita.com<br />
                Platform: BeautyCita Support Center
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px'
        }}>
          <p>Last updated: January 1, 2025</p>
          <p>© 2025 BeautyCita. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default ClientTerms