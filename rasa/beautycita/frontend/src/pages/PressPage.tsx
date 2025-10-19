import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  NewspaperIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const PressPage: React.FC = () => {
  const { t } = useTranslation();

  const newsItems = [
    {
      date: 'March 15, 2024',
      title: t('pages.press.newsItem1'),
      excerpt: 'BeautyCita announces $5M Series A funding round to expand AI-powered beauty platform across Latin America.',
      source: 'TechCrunch',
      link: '#'
    },
    {
      date: 'February 22, 2024',
      title: t('pages.press.newsItem2'),
      excerpt: 'Mexican startup BeautyCita launches revolutionary beauty booking app with Aphrodite AI technology.',
      source: 'Entrepreneur Mexico',
      link: '#'
    },
    {
      date: 'January 18, 2024',
      title: t('pages.press.newsItem3'),
      excerpt: 'BeautyCita forms strategic partnerships with leading beauty schools to enhance stylist education.',
      source: 'Beauty Industry Report',
      link: '#'
    }
  ];

  const mediaAssets = [
    {
      name: 'Brand Logo (PNG)',
      description: 'High-resolution BeautyCita logo in various formats',
      size: '2.3 MB'
    },
    {
      name: 'Company Photos',
      description: 'Team photos and office images',
      size: '15.7 MB'
    },
    {
      name: 'Product Screenshots',
      description: 'High-quality app screenshots and interface demos',
      size: '8.4 MB'
    },
    {
      name: 'Founder Headshots',
      description: 'Professional photos of founding team',
      size: '4.2 MB'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-600/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <NewspaperIcon className="h-16 w-16 text-blue-500" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('pages.press.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('pages.press.subtitle')}
          </p>
        </motion.div>
      </section>

      {/* Latest News Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pages.press.latestNews')}
            </h2>
          </motion.div>

          <div className="space-y-8">
            {newsItems.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">
                        {item.source}
                      </span>
                      <span className="text-sm text-gray-500">{item.date}</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                      <a href={item.link}>{item.title}</a>
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{item.excerpt}</p>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <a
                      href={item.link}
                      className="btn btn-outline-primary"
                    >
                      Read More
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <CameraIcon className="h-12 w-12 text-indigo-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pages.press.mediaKit')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Download high-quality assets, logos, and photos for your coverage of BeautyCita.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {mediaAssets.map((asset, index) => (
              <motion.div
                key={asset.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                      <DocumentArrowDownIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {asset.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{asset.description}</p>
                      <p className="text-xs text-gray-400">{asset.size}</p>
                    </div>
                  </div>
                  <button className="btn btn-outline-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Contact Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white"
        >
          <div className="flex justify-center mb-6">
            <EnvelopeIcon className="h-12 w-12 text-blue-200" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('pages.press.pressContact')}
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            For press inquiries, interviews, or additional information, please contact our press team.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Press Contact</h3>
            <div className="space-y-2 text-blue-100">
              <p>Maria Rodriguez</p>
              <p>Head of Communications</p>
              <a
                href="mailto:press@beautycita.com"
                className="text-white hover:text-blue-200 transition-colors font-medium"
              >
                {t('pages.press.pressEmail')}
              </a>
              <p>+52 55 1234 5679</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default PressPage;