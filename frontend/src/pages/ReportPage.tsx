import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, CheckCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { PageHero, GradientCard } from '../components/ui';

const ReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    category: 'technical',
    priority: 'medium',
    description: '',
    email: '',
    files: [] as File[]
  });

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
    { value: 'technical', label: 'Technical Issue', gradient: 'from-blue-500 to-indigo-600' },
    { value: 'safety', label: 'Safety Concern', gradient: 'from-red-500 to-pink-600' },
    { value: 'payment', label: 'Payment Problem', gradient: 'from-green-500 to-emerald-600' },
    { value: 'other', label: 'Other', gradient: 'from-purple-500 to-pink-600' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-blue-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Report submitted:', formData);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        category: 'technical',
        priority: 'medium',
        description: '',
        email: '',
        files: []
      });
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, files: Array.from(e.target.files) });
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="Report an Issue"
        subtitle="Help us improve BeautyCita by reporting problems or concerns"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-80"
      />

      {/* Report Form */}
      <section className="container mx-auto px-4 max-w-3xl py-16">
        <GradientCard gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10" isDarkMode={isDarkMode}>
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Report Submitted Successfully
              </h3>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Thank you for your report. Our team will review it and respond within 24-48 hours.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Problem Category */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Problem Category
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: category.value })}
                      className={`p-4 rounded-3xl border-2 transition-all ${
                        formData.category === category.value
                          ? `bg-gradient-to-r ${category.gradient} text-white border-transparent shadow-lg`
                          : isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Level */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className={`w-full px-4 py-3 rounded-3xl border transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Detailed Description
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide as much detail as possible about the issue..."
                  required
                  className={`w-full px-4 py-3 rounded-3xl border transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Your Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className={`w-full px-4 py-3 rounded-3xl border transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
                <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Provide your email if you'd like us to follow up with you
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Attachments (optional)
                </label>
                <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                  isDarkMode
                    ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <ArrowUpTrayIcon className={`h-12 w-12 mx-auto mb-3 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Click to upload files
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Screenshots, images, or documents (Max 10MB)
                  </p>
                  {formData.files.length > 0 && (
                    <div className="mt-4">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formData.files.length} file(s) selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Submit Report
              </button>
            </form>
          )}
        </GradientCard>

        {/* Info Section */}
        {!isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <GradientCard gradient="from-blue-500/10 to-indigo-500/10" isDarkMode={isDarkMode}>
              <div className="flex items-start space-x-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Before You Submit
                  </h3>
                  <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <li>• Include as much detail as possible to help us understand the issue</li>
                    <li>• Screenshots or screen recordings are extremely helpful</li>
                    <li>• Check our Help Center for common solutions</li>
                    <li>• For urgent safety concerns, please contact us immediately</li>
                  </ul>
                </div>
              </div>
            </GradientCard>
          </motion.div>
        )}
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
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Need Immediate Help?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            For urgent issues, our support team is available 24/7 via live chat.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Contact Support Now
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default ReportPage;
