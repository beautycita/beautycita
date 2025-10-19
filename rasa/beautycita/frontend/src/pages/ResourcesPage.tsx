import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  DocumentArrowDownIcon,
  PlayCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const ResourcesPage: React.FC = () => {
  const { t } = useTranslation();

  const resources = [
    {
      icon: AcademicCapIcon,
      title: t('pages.resources.setupGuide'),
      description: 'Complete guide to setting up your stylist profile',
      type: 'Guide'
    },
    {
      icon: ChartBarIcon,
      title: t('pages.resources.bestPractices'),
      description: 'Tips for maximizing your success on BeautyCita',
      type: 'Article'
    },
    {
      icon: CurrencyDollarIcon,
      title: t('pages.resources.pricing'),
      description: 'How to price your services competitively',
      type: 'Guide'
    },
    {
      icon: UserGroupIcon,
      title: t('pages.resources.clientManagement'),
      description: 'Building lasting relationships with clients',
      type: 'Article'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-6xl"
        >
          <div className="text-center mb-12">
            <AcademicCapIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {t('pages.resources.title')}
            </h1>
            <p className="text-xl text-gray-600">{t('pages.resources.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <AcademicCapIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('pages.resources.gettingStarted')}</h3>
              <p className="text-gray-600">Essential guides for new stylists</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <DocumentArrowDownIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('pages.resources.downloads')}</h3>
              <p className="text-gray-600">Templates and brand materials</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <PlayCircleIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('pages.resources.webinars')}</h3>
              <p className="text-gray-600">Live training sessions</p>
            </div>
          </div>

          <div className="space-y-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600">
                    <resource.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {resource.type}
                      </span>
                    </div>
                    <p className="text-gray-600">{resource.description}</p>
                  </div>
                  <button className="btn btn-outline-primary">
                    View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ResourcesPage;