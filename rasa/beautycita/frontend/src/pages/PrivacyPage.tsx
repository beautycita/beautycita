import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  EyeIcon,
  LockClosedIcon,
  UserIcon,
  ShareIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'data-collection',
      title: t('pages.privacy.dataCollection'),
      icon: EyeIcon,
      content: [
        'Personal information you provide when creating an account (name, email, phone number)',
        'Beauty preferences and service history to improve recommendations',
        'Profile photos and images you choose to upload',
        'Payment information processed securely through our payment partners',
        'Device information and usage data to improve our app performance',
        'Location data (with your permission) to show nearby stylists and services'
      ]
    },
    {
      id: 'data-use',
      title: t('pages.privacy.dataUse'),
      icon: UserIcon,
      content: [
        'Provide and improve our beauty booking and recommendation services',
        'Process payments and send transaction confirmations',
        'Send appointment reminders and service updates via SMS or email',
        'Personalize your experience with AI-powered beauty recommendations',
        'Communicate important account and service information',
        'Comply with legal obligations and resolve disputes'
      ]
    },
    {
      id: 'data-sharing',
      title: t('pages.privacy.dataSharing'),
      icon: ShareIcon,
      content: [
        'With beauty professionals you book services with (name, contact info)',
        'With payment processors to handle transactions securely',
        'With SMS and email service providers for notifications',
        'With analytics providers to understand app usage (anonymized data)',
        'When required by law or to protect our rights and users',
        'We never sell your personal data to third parties for marketing'
      ]
    },
    {
      id: 'security',
      title: t('pages.privacy.security'),
      icon: LockClosedIcon,
      content: [
        'End-to-end encryption for sensitive data transmission',
        'Secure data storage with industry-standard encryption',
        'Regular security audits and penetration testing',
        'Limited access to personal data on a need-to-know basis',
        'Secure payment processing through PCI-compliant partners',
        'Automatic logout after periods of inactivity'
      ]
    },
    {
      id: 'your-rights',
      title: t('pages.privacy.rights'),
      icon: ShieldCheckIcon,
      content: [
        'Access and review your personal data at any time',
        'Correct or update your information through your profile',
        'Delete your account and associated data',
        'Export your data in a portable format',
        'Opt out of marketing communications',
        'File complaints with data protection authorities'
      ]
    }
  ];

  const lastUpdated = t('pages.privacy.lastUpdated');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-gray-600/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <ShieldCheckIcon className="h-16 w-16 text-slate-600" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent">
            {t('pages.privacy.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-6">
            {t('pages.privacy.subtitle')}
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
                {t('pages.privacy.intro')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                At BeautyCita, we believe your privacy is fundamental to your trust in our platform.
                This Privacy Policy explains how we collect, use, protect, and share your personal information
                when you use our beauty booking platform. We are committed to transparency and giving you
                control over your data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Privacy Sections */}
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
                  <div className="p-3 rounded-full bg-gradient-to-r from-slate-600 to-gray-600 mr-4">
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
                      <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
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
      <section className="py-16 px-4 bg-gradient-to-r from-slate-600 to-gray-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white"
        >
          <div className="flex justify-center mb-6">
            <EnvelopeIcon className="h-12 w-12 text-slate-200" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('pages.privacy.contact')}
          </h2>
          <p className="text-xl mb-8 text-slate-200">
            If you have any questions about this Privacy Policy or how we handle your data,
            please don't hesitate to contact our privacy team.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Privacy Officer</h3>
            <div className="space-y-2 text-slate-200">
              <p>Email: privacy@beautycita.com</p>
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
              This Privacy Policy is effective as of the date listed above and may be updated from time to time.
              We will notify you of any material changes by posting the new Privacy Policy on our website
              and updating the "Last Updated" date.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;