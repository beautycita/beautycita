import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const StatusPage: React.FC = () => {
  const { t } = useTranslation();

  const services = [
    { name: t('pages.status.website'), status: 'operational' },
    { name: t('pages.status.mobileApp'), status: 'operational' },
    { name: t('pages.status.api'), status: 'operational' },
    { name: t('pages.status.payments'), status: 'operational' },
    { name: t('pages.status.notifications'), status: 'operational' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'outage':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'maintenance':
        return <ClockIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'outage':
        return 'text-red-600';
      case 'maintenance':
        return 'text-blue-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-4xl text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {t('pages.status.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">{t('pages.status.subtitle')}</p>

          <div className="bg-green-100 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <span className="text-xl font-semibold text-green-800">
                {t('pages.status.allSystems')}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">{t('pages.status.services')}</h2>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <span className="font-medium text-gray-900">{service.name}</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                    <span className={`font-medium ${getStatusColor(service.status)}`}>
                      {t(`pages.status.${service.status}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-6">
              {t('pages.status.lastUpdated')}: {new Date().toLocaleString()}
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default StatusPage;