import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  CurrencyDollarIcon,
  HeartIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const CareersPage: React.FC = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: CurrencyDollarIcon,
      title: t('pages.careers.benefit1'),
      description: 'Competitive compensation with equity opportunities'
    },
    {
      icon: HeartIcon,
      title: t('pages.careers.benefit2'),
      description: 'Full health, dental, and vision coverage'
    },
    {
      icon: GlobeAltIcon,
      title: t('pages.careers.benefit3'),
      description: 'Work from anywhere in the world'
    },
    {
      icon: AcademicCapIcon,
      title: t('pages.careers.benefit4'),
      description: '$2,000 annual budget for courses and conferences'
    },
    {
      icon: SparklesIcon,
      title: t('pages.careers.benefit5'),
      description: 'Monthly allowance for beauty services'
    }
  ];

  const positions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      type: 'Full-time',
      location: 'Remote',
      description: 'Build beautiful, responsive user interfaces with React and TypeScript'
    },
    {
      title: 'AI/ML Engineer',
      department: 'Data Science',
      type: 'Full-time',
      location: 'Mexico City / Remote',
      description: 'Develop and improve our Aphrodite AI recommendation engine'
    },
    {
      title: 'Beauty Content Creator',
      department: 'Marketing',
      type: 'Part-time',
      location: 'Remote',
      description: 'Create engaging content about beauty trends and tips'
    },
    {
      title: 'Customer Success Manager',
      department: 'Operations',
      type: 'Full-time',
      location: 'Mexico City',
      description: 'Help our stylists succeed and grow their businesses'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-600/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <BriefcaseIcon className="h-16 w-16 text-purple-500" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t('pages.careers.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('pages.careers.subtitle')}
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('pages.careers.intro')}
          </p>
        </motion.div>
      </section>

      {/* Benefits Section */}
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
              {t('pages.careers.benefits')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 text-center">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-center">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pages.careers.openPositions')}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {positions.map((position, index) => (
              <motion.div
                key={position.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {position.title}
                      </h3>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {position.department}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{position.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>📍 {position.location}</span>
                      <span>⏰ {position.type}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <button className="btn btn-primary">
                      Apply Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Don't see the perfect role?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            {t('pages.careers.noOpenings')}
          </p>
          <button className="btn bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4">
            Send Us Your Resume
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default CareersPage;