import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

const LicensesPage: React.FC = () => {
  const { t } = useTranslation();

  const licenses = [
    { name: t('pages.licenses.react'), license: 'MIT License', description: 'JavaScript library for building user interfaces' },
    { name: t('pages.licenses.typescript'), license: 'Apache 2.0 License', description: 'Typed superset of JavaScript' },
    { name: t('pages.licenses.tailwind'), license: 'MIT License', description: 'Utility-first CSS framework' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-4xl"
        >
          <div className="text-center mb-12">
            <CodeBracketIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {t('pages.licenses.title')}
            </h1>
            <p className="text-xl text-gray-600">{t('pages.licenses.subtitle')}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.licenses.intro')}</h2>
            <p className="text-gray-600">
              {t('pages.licenses.intro')}
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('pages.licenses.openSource')}</h2>
            {licenses.map((license, index) => (
              <motion.div
                key={license.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{license.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{license.description}</p>
                  </div>
                  <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {license.license}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default LicensesPage;