import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  DocumentArrowDownIcon,
  PlayCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { PageHero, GradientCard } from '../components/ui';

const ResourcesPage: React.FC = () => {
  const { t } = useTranslation();
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

  const categories = [
    {
      icon: AcademicCapIcon,
      title: 'Getting Started',
      description: 'Essential guides for new stylists',
      gradient: 'from-pink-500 to-purple-600',
      count: 12
    },
    {
      icon: DocumentArrowDownIcon,
      title: 'Downloads',
      description: 'Templates and brand materials',
      gradient: 'from-purple-500 to-blue-600',
      count: 8
    },
    {
      icon: PlayCircleIcon,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      gradient: 'from-blue-500 to-indigo-600',
      count: 24
    }
  ];

  const resources = [
    {
      icon: AcademicCapIcon,
      title: 'Stylist Setup Guide',
      description: 'Complete guide to setting up your stylist profile and getting your first clients',
      type: 'Guide',
      gradient: 'from-pink-500 to-purple-600',
      duration: '15 min read'
    },
    {
      icon: ChartBarIcon,
      title: 'Marketing Best Practices',
      description: 'Tips for maximizing your visibility and attracting more clients on BeautyCita',
      type: 'Article',
      gradient: 'from-purple-500 to-blue-600',
      duration: '10 min read'
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Pricing Strategy Guide',
      description: 'How to price your services competitively while maximizing your earnings',
      type: 'Guide',
      gradient: 'from-blue-500 to-indigo-600',
      duration: '12 min read'
    },
    {
      icon: UserGroupIcon,
      title: 'Client Management Tips',
      description: 'Building lasting relationships and turning first-time clients into regulars',
      type: 'Article',
      gradient: 'from-indigo-500 to-purple-600',
      duration: '8 min read'
    },
    {
      icon: SparklesIcon,
      title: 'Portfolio Photography',
      description: 'Professional tips for showcasing your work and attracting dream clients',
      type: 'Guide',
      gradient: 'from-purple-500 to-pink-600',
      duration: '15 min read'
    },
    {
      icon: BookOpenIcon,
      title: 'Booking Management',
      description: 'Efficiently manage your schedule, cancellations, and client communications',
      type: 'Guide',
      gradient: 'from-pink-500 to-red-600',
      duration: '10 min read'
    }
  ];

  const videoTutorials = [
    { title: 'Setting Up Your Profile', duration: '8:24', views: '2.3K' },
    { title: 'Managing Your Calendar', duration: '5:16', views: '1.8K' },
    { title: 'Handling Client Requests', duration: '12:45', views: '3.1K' },
    { title: 'Growing Your Business', duration: '15:32', views: '4.2K' }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="Stylist Resources"
        subtitle="Everything you need to succeed on BeautyCita"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-80"
      />

      {/* Resource Categories */}
      <section className="container mx-auto px-4 max-w-6xl py-16">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={`${category.gradient}/10`}
                isDarkMode={isDarkMode}
                className="text-center cursor-pointer hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-3xl bg-gradient-to-r ${category.gradient} group-hover:scale-110 transition-transform shadow-lg`}>
                    <category.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {category.title}
                </h3>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {category.description}
                </p>
                <span className={`text-xs px-3 py-1.5 rounded-full ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700'
                }`}>
                  {category.count} resources
                </span>
              </GradientCard>
            </motion.div>
          ))}
        </div>

        {/* Featured Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Featured Resources
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Popular guides and articles to grow your business
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={`${resource.gradient}/10`}
                isDarkMode={isDarkMode}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 h-full"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-3xl bg-gradient-to-r ${resource.gradient} flex-shrink-0`}>
                    <resource.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        resource.type === 'Guide'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {resource.type}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {resource.duration}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {resource.title}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {resource.description}
                    </p>
                    <div className="mt-4">
                      <span className="text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        Read more →
                      </span>
                    </div>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>

        {/* Video Tutorials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Video Tutorials
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Learn by watching step-by-step video guides
          </p>
        </motion.div>

        <GradientCard gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10" isDarkMode={isDarkMode}>
          <div className="grid md:grid-cols-2 gap-4">
            {videoTutorials.map((video, index) => (
              <motion.div
                key={video.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className={`p-4 rounded-3xl flex items-center space-x-4 cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-gray-800/50 hover:bg-gray-700/50'
                    : 'bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                    <PlayCircleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {video.title}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {video.duration}
                    </span>
                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {video.views} views
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GradientCard>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-3xl blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white relative z-10 px-4"
        >
          <UserGroupIcon className="h-16 w-16 text-white/90 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join the Community
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Connect with other stylists, share tips, and learn from the best in our community forum.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Join Community
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default ResourcesPage;
