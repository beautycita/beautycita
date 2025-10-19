import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const PoliciesPage: React.FC = () => {
  const { t } = useTranslation();

  const policies = [
    {
      title: t('pages.policies.professionalStandards'),
      content: 'All stylists must maintain the highest standards of professionalism and customer service.'
    },
    {
      title: t('pages.policies.qualifications'),
      content: 'Valid beauty license and certifications required for verification.'
    },
    {
      title: t('pages.policies.conduct'),
      content: 'Respectful treatment of all clients and adherence to platform guidelines.'
    },
    {
      title: t('pages.policies.clientSafety'),
      content: 'Strict hygiene and safety protocols must be followed at all times.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto max-w-4xl"
        >
          <div className="text-center mb-12">
            <ShieldCheckIcon className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              {t('pages.policies.title')}
            </h1>
            <p className="text-xl text-gray-600">{t('pages.policies.subtitle')}</p>
          </div>

          <div className="space-y-8">
            {policies.map((policy, index) => (
              <motion.div
                key={policy.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{policy.title}</h2>
                <p className="text-gray-600 leading-relaxed">{policy.content}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default PoliciesPage;