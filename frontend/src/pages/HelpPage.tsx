import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { PageHero, GradientCard } from '../components/ui';

const HelpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    const handleStorageChange = () => {
      setIsDarkMode(localStorage.getItem('darkMode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const helpCategories = [
    {
      icon: RocketLaunchIcon,
      title: 'Getting Started',
      description: 'Learn the basics of using BeautyCita',
      articles: 8,
      gradient: 'from-pink-500 to-purple-600',
      link: '/about'
    },
    {
      icon: CalendarIcon,
      title: t('pages.help.booking'),
      description: 'Learn how to book services, manage appointments, and reschedule',
      articles: 8,
      gradient: 'from-purple-500 to-blue-600',
      link: '/booking'
    },
    {
      icon: CreditCardIcon,
      title: t('pages.help.payments'),
      description: 'Payment methods, billing, refunds, and subscription management',
      articles: 6,
      gradient: 'from-blue-500 to-indigo-600',
      link: '/payment-methods'
    },
    {
      icon: UserIcon,
      title: t('pages.help.account'),
      description: 'Profile settings, preferences, and account security',
      articles: 5,
      gradient: 'from-indigo-500 to-purple-600',
      link: '/settings'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Safety & Trust',
      description: 'Security features and trust protocols',
      articles: 7,
      gradient: 'from-purple-500 to-pink-600',
      link: '/privacy'
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
      views: 1234,
      link: '/about'
    },
    {
      title: 'Understanding Your Beauty Profile',
      description: 'How to set up preferences for better recommendations',
      views: 987,
      link: '/profile'
    },
    {
      title: 'Booking Your First Appointment',
      description: 'Step-by-step booking process',
      views: 856,
      link: '/booking'
    },
    {
      title: 'Stylist Selection Tips',
      description: 'How to choose the perfect stylist for you',
      views: 743,
      link: '/stylists'
    }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title={t('pages.help.title')}
        subtitle={t('pages.help.subtitle')}
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
      >
        {/* Search Bar */}
        <div className="relative max-w-xl mx-auto mt-8">
          <MagnifyingGlassIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            type="text"
            placeholder={t('pages.help.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-6 py-4 rounded-full border focus:ring-2 transition-all text-lg shadow-lg ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500'
            }`}
          />
        </div>
      </PageHero>

      {/* Help Categories */}
      <section className="container mx-auto px-4 max-w-6xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('pages.help.popularTopics')}
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Browse help by topic
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div onClick={() => navigate(category.link)}>
                <GradientCard
                  gradient={`${category.gradient}/10`}
                  isDarkMode={isDarkMode}
                  className="h-full cursor-pointer group hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full bg-gradient-to-r ${category.gradient} group-hover:scale-110 transition-transform shadow-lg`}>
                      <category.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className={`text-xl font-bold mb-3 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {category.title}
                  </h3>
                  <p className={`text-sm text-center mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {category.description}
                  </p>
                  <div className="text-center">
                    <span className={`text-xs px-3 py-1.5 rounded-full ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700'
                    }`}>
                      {category.articles} articles
                    </span>
                  </div>
                </GradientCard>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 max-w-4xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('pages.help.faq')}
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Quick answers to common questions
          </p>
        </motion.div>

        <GradientCard gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10" isDarkMode={isDarkMode}>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className={`rounded-3xl overflow-hidden ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'
                } backdrop-blur-sm`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className={`w-full p-6 text-left flex justify-between items-center transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/70'
                  }`}
                >
                  <h3 className={`text-lg font-semibold pr-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {faq.question}
                  </h3>
                  <ChevronDownIcon
                    className={`h-5 w-5 flex-shrink-0 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
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
                    <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </GradientCard>
      </section>

      {/* Popular Articles */}
      <section className="container mx-auto px-4 max-w-6xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Popular Articles
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Most helpful guides and resources
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {popularArticles.map((article, index) => (
            <motion.div
              key={article.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div onClick={() => navigate(article.link)}>
                <GradientCard
                  gradient="from-pink-500/5 via-purple-500/5 to-blue-500/5"
                  isDarkMode={isDarkMode}
                  className="cursor-pointer group hover:shadow-xl transition-all duration-300"
                >
                  <h3 className={`text-lg font-bold mb-3 ${
                    isDarkMode ? 'text-white group-hover:text-purple-400' : 'text-gray-900 group-hover:text-purple-600'
                  } transition-colors`}>
                    {article.title}
                  </h3>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {article.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>
                      {article.views} views
                    </span>
                    <span className="font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                      Read more →
                    </span>
                  </div>
                </GradientCard>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white relative z-10 px-4"
        >
          <div className="flex justify-center mb-6">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-white/90" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('pages.help.stillNeedHelp')}
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Our support team is available 24/7 to help you with any questions or issues.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            {t('pages.help.contactSupport')}
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default HelpPage;