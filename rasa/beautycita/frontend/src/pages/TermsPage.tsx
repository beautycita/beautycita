import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ScaleIcon,
  UserIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'acceptance',
      title: t('pages.terms.acceptance'),
      icon: ScaleIcon,
      content: [
        'By creating an account or using BeautyCita, you agree to these Terms of Service',
        'You must be at least 18 years old to use our platform',
        'If you disagree with any part of these terms, you may not use our service',
        'These terms constitute a legally binding agreement between you and BeautyCita',
        'Your continued use of the platform constitutes acceptance of any updates to these terms'
      ]
    },
    {
      id: 'services',
      title: t('pages.terms.services'),
      icon: UserIcon,
      content: [
        'BeautyCita is a platform that connects clients with beauty professionals',
        'We provide booking, payment processing, and communication tools',
        'AI-powered recommendations through our Aphrodite technology',
        'We do not directly provide beauty services - these are provided by independent stylists',
        'Service availability may vary by location and stylist schedule',
        'We reserve the right to modify or discontinue services with notice'
      ]
    },
    {
      id: 'accounts',
      title: t('pages.terms.accounts'),
      icon: UserIcon,
      content: [
        'You must provide accurate and complete information when creating an account',
        'You are responsible for maintaining the security of your account credentials',
        'You may not share your account with others or create multiple accounts',
        'We reserve the right to suspend or terminate accounts that violate these terms',
        'You must notify us immediately of any unauthorized account access',
        'Account termination does not affect existing booking obligations'
      ]
    },
    {
      id: 'conduct',
      title: t('pages.terms.conduct'),
      icon: ExclamationTriangleIcon,
      content: [
        'Treat all platform users with respect and professionalism',
        'Do not post inappropriate, offensive, or false content',
        'Respect intellectual property rights of BeautyCita and other users',
        'Do not attempt to circumvent our booking or payment systems',
        'Report any suspicious or inappropriate behavior to our support team',
        'Violations may result in account suspension or termination'
      ]
    },
    {
      id: 'payment',
      title: t('pages.terms.payment'),
      icon: CreditCardIcon,
      content: [
        'All payments are processed securely through our payment partners',
        'You authorize us to charge your selected payment method for bookings',
        'Prices are displayed in Mexican Pesos (MXN) unless otherwise specified',
        'Service fees and taxes will be clearly displayed before payment',
        'Refunds are subject to our cancellation policy and stylist terms',
        'Disputed charges should be reported within 30 days of the transaction'
      ]
    },
    {
      id: 'cancellation',
      title: t('pages.terms.cancellation'),
      icon: PencilSquareIcon,
      content: [
        'Clients may cancel appointments up to 24 hours before the scheduled time',
        'Cancellations within 24 hours may incur a cancellation fee',
        'No-shows may be charged the full service amount',
        'Stylists may cancel appointments with at least 4 hours notice',
        'Emergency cancellations will be handled on a case-by-case basis',
        'Refunds for cancelled services will be processed within 5-7 business days'
      ]
    },
    {
      id: 'liability',
      title: t('pages.terms.liability'),
      icon: ExclamationTriangleIcon,
      content: [
        'BeautyCita acts as an intermediary between clients and beauty professionals',
        'We are not liable for the quality or outcome of beauty services provided',
        'Our liability is limited to the amount paid for the specific service',
        'We are not responsible for injuries or damages during service provision',
        'Users participate in beauty services at their own risk',
        'We recommend verifying stylist credentials and qualifications'
      ]
    },
    {
      id: 'modifications',
      title: t('pages.terms.modifications'),
      icon: PencilSquareIcon,
      content: [
        'We may update these Terms of Service from time to time',
        'Material changes will be communicated via email or platform notification',
        'Continued use of the platform constitutes acceptance of updated terms',
        'You can review the current terms at any time on our website',
        'If you disagree with updates, you may terminate your account',
        'The most current version of these terms will always be available on our platform'
      ]
    }
  ];

  const lastUpdated = t('pages.terms.lastUpdated');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-600/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <DocumentTextIcon className="h-16 w-16 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            {t('pages.terms.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-6">
            {t('pages.terms.subtitle')}
          </p>
          <p className="text-sm text-gray-500 bg-gray-100 inline-block px-4 py-2 rounded-full">
            {lastUpdated}
          </p>
        </motion.div>
      </section>

      {/* Introduction */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none"
          >
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to BeautyCita
              </h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms of Service ("Terms") govern your use of the BeautyCita platform,
                including our website, mobile applications, and related services. By using our platform,
                you agree to be bound by these terms. Please read them carefully before using our services.
                If you have any questions about these terms, please contact our legal team.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 mr-4">
                    <section.icon className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start space-x-3 text-gray-600"
                    >
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-blue-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white"
        >
          <div className="flex justify-center mb-6">
            <ScaleIcon className="h-12 w-12 text-indigo-200" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Questions About These Terms?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            If you have any questions about these Terms of Service or need clarification
            on any provisions, our legal team is here to help.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Legal Department</h3>
            <div className="space-y-2 text-indigo-200">
              <p>Email: legal@beautycita.com</p>
              <p>Address: Av. Insurgentes Sur 1234</p>
              <p>Ciudad de México, México</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Legal Notice */}
      <section className="py-8 px-4 bg-gray-100">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center text-sm text-gray-600"
          >
            <p>
              These Terms of Service are governed by the laws of Mexico.
              Any disputes arising from these terms will be resolved in the courts of Mexico City.
              If any provision of these terms is found to be unenforceable,
              the remaining provisions will continue in full force and effect.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;