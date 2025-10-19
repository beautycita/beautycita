import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const HelpPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const helpCategories = [
    {
      icon: CalendarIcon,
      title: t('pages.help.booking'),
      description: 'Learn how to book services, manage appointments, and reschedule',
      articles: 8
    },
    {
      icon: CreditCardIcon,
      title: t('pages.help.payments'),
      description: 'Payment methods, billing, refunds, and subscription management',
      articles: 6
    },
    {
      icon: UserIcon,
      title: t('pages.help.account'),
      description: 'Profile settings, preferences, and account security',
      articles: 5
    },
    {
      icon: WrenchScrewdriverIcon,
      title: t('pages.help.technical'),
      description: 'App issues, troubleshooting, and technical support',
      articles: 4
    }
  ];

  const faqs = [
    {
      question: 'How do I book an appointment through BeautyCita?',
      answer: 'To book an appointment, browse our services or stylists, select your preferred time slot, and complete the booking form. You\'ll receive a confirmation email and SMS with all the details.'
    },
    {
      question: 'Can I cancel or reschedule my appointment?',
      answer: 'Yes, you can cancel or reschedule up to 24 hours before your appointment without any fees. Simply go to "My Bookings" in your profile or contact the stylist directly.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and digital payment methods including PayPal and Apple Pay. Payment is processed securely through our platform.'
    },
    {
      question: 'How does the Aphrodite AI recommendation system work?',
      answer: 'Aphrodite AI analyzes your preferences, beauty history, and current trends to suggest personalized services and stylists that match your style and needs.'
    },
    {
      question: 'What if I\'m not satisfied with my service?',
      answer: 'We have a 100% satisfaction guarantee. If you\'re not happy with your service, contact us within 24 hours and we\'ll work to resolve the issue or provide a full refund.'
    },
    {
      question: 'How do I become a verified stylist on BeautyCita?',
      answer: 'Apply through our stylist registration page, submit your credentials and portfolio, and complete our verification process. Once approved, you can start accepting bookings.'
    }
  ];

  const popularArticles = [
    {
      title: 'Getting Started with BeautyCita',
      description: 'Complete guide for new users',
      views: 1234
    },
    {
      title: 'Understanding Your Beauty Profile',
      description: 'How to set up preferences for better recommendations',
      views: 987
    },
    {
      title: 'Booking Your First Appointment',
      description: 'Step-by-step booking process',
      views: 856
    },
    {
      title: 'Stylist Selection Tips',
      description: 'How to choose the perfect stylist for you',
      views: 743
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-600/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <QuestionMarkCircleIcon className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {t('pages.help.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('pages.help.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder={t('pages.help.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-lg shadow-lg"
            />
          </div>
        </motion.div>
      </section>

      {/* Help Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pages.help.popularTopics')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 group-hover:scale-110 transition-transform">
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center group-hover:text-amber-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-gray-600 text-sm text-center mb-3">{category.description}</p>
                <div className="text-center">
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    {category.articles} articles
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pages.help.faq')}
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <ChevronDownIcon
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Popular Articles
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {popularArticles.map((article, index) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 mb-3">{article.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{article.views} views</span>
                  <span className="text-amber-600 font-medium">Read more →</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-amber-600 to-orange-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white"
        >
          <div className="flex justify-center mb-6">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-amber-200" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('pages.help.stillNeedHelp')}
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Our support team is available 24/7 to help you with any questions or issues.
          </p>
          <button className="btn bg-white text-amber-600 hover:bg-gray-100 font-semibold px-8 py-4">
            {t('pages.help.contactSupport')}
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default HelpPage;