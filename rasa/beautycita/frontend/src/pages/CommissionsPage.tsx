import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, TrophyIcon, ClockIcon } from '@heroicons/react/24/outline';

const CommissionsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-4xl"
        >
          <div className="text-center mb-12">
            <CurrencyDollarIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {t('pages.commissions.title')}
            </h1>
            <p className="text-xl text-gray-600">{t('pages.commissions.subtitle')}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('pages.commissions.overview')}</h2>
            <p className="text-gray-600">
              BeautyCita offers competitive commission rates that reward quality service and professional growth.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">80%</div>
              <div className="text-yellow-100">{t('pages.commissions.tier1')}</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">85%</div>
              <div className="text-amber-100">{t('pages.commissions.tier2')}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white text-center">
              <div className="text-3xl font-bold mb-2">90%</div>
              <div className="text-orange-100">{t('pages.commissions.tier3')}</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">{t('pages.commissions.payments')}</h2>
              </div>
              <p className="text-gray-600">{t('pages.commissions.paymentInfo')}</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                <TrophyIcon className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">{t('pages.commissions.bonuses')}</h2>
              </div>
              <p className="text-gray-600">{t('pages.commissions.bonusInfo')}</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default CommissionsPage;