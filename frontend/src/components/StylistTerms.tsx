import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const StylistTerms: React.FC = () => {
  const { t } = useTranslation()

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
            {t('terms.stylist.title')}
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {t('terms.stylist.effectiveDate')}
          </p>
        </div>

        {/* Content */}
        <div style={{
          lineHeight: '1.6',
          color: '#333'
        }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>1. {t('terms.stylist.acceptance')}</h2>
            <p>
              {t('terms.stylist.acceptanceDesc')}
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>2. {t('terms.stylist.requirements')}</h2>
            <p>{t('terms.stylist.requirementsDesc')}</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>{t('terms.stylist.req1')}</li>
              <li>{t('terms.stylist.req2')}</li>
              <li>{t('terms.stylist.req3')}</li>
              <li>{t('terms.stylist.req4')}</li>
              <li>{t('terms.stylist.req5')}</li>
              <li>{t('terms.stylist.req6')}</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>3. {t('terms.stylist.commissionStructure')}</h2>
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '2px solid var(--accent-rose)',
              textAlign: 'center'
            }}>
              <h3 style={{
                color: '#333',
                marginBottom: '12px',
                fontSize: '20px',
                background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                💰 {t('terms.stylist.platformFeeTitle')}
              </h3>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{t('terms.stylist.dailyPayouts')}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>3.1 {t('terms.stylist.platformFeeDetails')}</h3>
              <p>
                {t('terms.stylist.platformFeeDetailsDesc')}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>3.2 {t('terms.stylist.payoutSchedule')}</h3>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li><strong>Frecuencia:</strong> {t('terms.stylist.payoutFreq')}</li>
                <li><strong>Activador:</strong> {t('terms.stylist.payoutTrigger')}</li>
                <li><strong>Tiempo de Procesamiento:</strong> {t('terms.stylist.payoutTime')}</li>
                <li><strong>Cantidad:</strong> {t('terms.stylist.payoutAmount')}</li>
                <li><strong>Estado de Tarifa:</strong> {t('terms.stylist.payoutFeeStatus')}</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>3.3 {t('terms.stylist.paymentTerms')}</h3>
              <p>
                {t('terms.stylist.paymentTermsDesc')}
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>4. Service Standards & Quality</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>4.1 Professional Standards</h3>
              <p>You agree to:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Provide services with professional skill and care</li>
                <li>Maintain clean, sanitary work environment and tools</li>
                <li>Arrive punctually for all appointments</li>
                <li>Communicate clearly with clients about services and expectations</li>
                <li>Follow all health and safety regulations</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>4.2 Rating Requirements</h3>
              <p>
                Maintain a minimum 4.0-star average rating. Consistently low ratings may result in account review
                or suspension. We provide coaching and support to help maintain quality standards.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>5. Portfolio & Profile Management</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>5.1 Profile Requirements</h3>
              <p>Your profile must include:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Professional headshot and portfolio images</li>
                <li>Accurate service descriptions and pricing</li>
                <li>Current certifications and specialties</li>
                <li>Available booking times and location</li>
                <li>Professional bio highlighting your experience</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>5.2 Content Guidelines</h3>
              <p>
                All profile content must be original, professional, and accurately represent your work.
                Inappropriate, misleading, or copyrighted content will be removed.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>6. Booking & Scheduling</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>6.1 Availability Management</h3>
              <p>
                You are responsible for maintaining accurate availability on the platform. Update your calendar
                regularly to prevent double bookings and ensure smooth client experience.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>6.2 Cancellation Policy</h3>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li><strong>24+ hours notice:</strong> No penalty</li>
                <li><strong>6-24 hours notice:</strong> Warning issued</li>
                <li><strong>Less than 6 hours:</strong> Commission penalty may apply</li>
                <li><strong>No-shows:</strong> Full commission forfeiture + warning</li>
              </ul>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>7. Business Tools & Support</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>7.1 Analytics Dashboard</h3>
              <p>
                Access comprehensive business analytics including booking trends, revenue tracking,
                client feedback, and performance metrics to help grow your business.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>7.2 Marketing Support</h3>
              <p>
                Benefit from platform-wide marketing, SEO optimization, social media promotion,
                and Aphrodite AI matching to connect with ideal clients.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>8. Independent Contractor Status</h2>
            <p>
              You are an independent contractor, not an employee of BeautyCita. You are responsible for:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Setting your own service prices and availability</li>
              <li>Providing your own tools, supplies, and workspace</li>
              <li>Paying all applicable taxes and business expenses</li>
              <li>Maintaining your own business insurance</li>
              <li>Complying with local business licensing requirements</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>9. Prohibited Activities</h2>
            <p>You may not:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Solicit clients to book services outside the platform</li>
              <li>Share client contact information without consent</li>
              <li>Engage in discriminatory practices</li>
              <li>Use the platform for illegal activities</li>
              <li>Create fake reviews or manipulate ratings</li>
              <li>Violate health and safety regulations</li>
            </ul>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>10. Liability & Insurance</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>10.1 Professional Liability</h3>
              <p>
                You are solely responsible for the quality and safety of services provided. BeautyCita
                strongly recommends maintaining professional liability insurance.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>10.2 Platform Liability</h3>
              <p>
                BeautyCita's liability is limited to facilitating bookings and payments. We are not
                liable for service quality, client satisfaction, or any incidents during service provision.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>11. Account Suspension & Termination</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>11.1 Suspension Causes</h3>
              <p>Your account may be suspended for:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Violations of these Terms</li>
                <li>Client complaints or safety concerns</li>
                <li>Fraudulent activity or payment disputes</li>
                <li>Consistently low ratings or no-shows</li>
                <li>Failure to maintain required licenses</li>
              </ul>
            </div>

            <div>
              <h3 style={{ color: '#333', marginBottom: '8px', fontSize: '18px' }}>11.2 Termination Process</h3>
              <p>
                Either party may terminate this agreement with 30 days notice. Outstanding payments
                will be processed according to standard schedule minus any applicable fees or chargebacks.
              </p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>12. Intellectual Property</h2>
            <p>
              You retain ownership of your portfolio images and content but grant BeautyCita a license
              to use them for platform promotion and marketing. BeautyCita owns all platform technology,
              branding, and proprietary algorithms including Aphrodite AI.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>13. Dispute Resolution</h2>
            <p>
              Service disputes should first be resolved directly with clients through our platform messaging.
              Unresolved disputes may be mediated by BeautyCita support. Legal disputes are subject to
              binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>14. Updates to Terms</h2>
            <p>
              We may update these Terms periodically. Significant changes will be communicated via email
              and platform notification 30 days in advance. Continued use of the platform constitutes
              acceptance of updated Terms.
            </p>
          </section>

          <section>
            <h2 style={{ color: '#333', marginBottom: '16px' }}>15. Contact & Support</h2>
            <p>
              For questions about these Terms or platform support, contact us at:
            </p>
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <p style={{ margin: 0 }}>
                <strong>BeautyCita Stylist Support</strong><br />
                Email: stylists@beautycita.com<br />
                Phone: 1-800-BEAUTY-1<br />
                Platform: BeautyCita Stylist Dashboard → Support
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

export default StylistTerms