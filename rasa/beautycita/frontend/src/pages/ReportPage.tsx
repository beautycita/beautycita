import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    issueType: 'technical',
    description: '',
    email: ''
  });

  const issueTypes = [
    { value: 'technical', label: t('pages.report.technical') },
    { value: 'inappropriate', label: t('pages.report.inappropriate') },
    { value: 'spam', label: t('pages.report.spam') },
    { value: 'fraud', label: t('pages.report.fraud') },
    { value: 'other', label: t('pages.report.other') }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-2xl"
        >
          <div className="text-center mb-8">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4 text-gray-900">{t('pages.report.title')}</h1>
            <p className="text-xl text-gray-600">{t('pages.report.subtitle')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pages.report.issueType')}
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({...formData, issueType: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {issueTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pages.report.description')}
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Please provide details about the issue..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full btn bg-red-600 text-white hover:bg-red-700 py-4"
              >
                {t('pages.report.submit')}
              </button>
            </form>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{t('pages.report.thankYou')}</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ReportPage;