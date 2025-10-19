import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CogIcon } from '@heroicons/react/24/outline';

const CookiesPage: React.FC = () => {
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
            <CogIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {t('pages.cookies.title')}
            </h1>
            <p className="text-xl text-gray-600">{t('pages.cookies.subtitle')}</p>
            <p className="text-sm text-gray-500 mt-4">{t('pages.cookies.lastUpdated')}</p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.cookies.whatAreCookies')}</h2>
              <p className="text-gray-600">
                Cookies are small text files stored on your device when you visit our website.
                They help us provide you with a better experience by remembering your preferences
                and improving our services.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.cookies.howWeUse')}</h2>
              <p className="text-gray-600">
                We use cookies to enhance your browsing experience, analyze website traffic,
                personalize content, and remember your login status and preferences.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.cookies.typesOfCookies')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('pages.cookies.essential')}</h3>
                  <p className="text-gray-600">Required for the website to function properly</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('pages.cookies.analytics')}</h3>
                  <p className="text-gray-600">Help us understand how visitors use our website</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('pages.cookies.marketing')}</h3>
                  <p className="text-gray-600">Used to personalize ads and marketing content</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.cookies.managing')}</h2>
              <p className="text-gray-600">
                You can manage cookies through your browser settings. Note that disabling
                certain cookies may affect website functionality.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default CookiesPage;