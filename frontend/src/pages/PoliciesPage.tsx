import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  UserGroupIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { PageHero, GradientCard } from '../components/ui';

const PoliciesPage: React.FC = () => {
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

  const policies = [
    {
      icon: AcademicCapIcon,
      title: 'Professional Qualifications',
      gradient: 'from-pink-500 to-purple-600',
      content: [
        'Valid beauty/cosmetology license required for verification',
        'Minimum 1 year of professional experience',
        'Up-to-date certifications in your specialty areas',
        'Portfolio demonstrating quality of work',
        'Professional liability insurance recommended'
      ]
    },
    {
      icon: UserGroupIcon,
      title: 'Code of Conduct',
      gradient: 'from-purple-500 to-blue-600',
      content: [
        'Treat all clients with respect and professionalism',
        'Maintain client confidentiality at all times',
        'Arrive on time for all appointments',
        'Communicate clearly about services and pricing',
        'Respond to client inquiries within 24 hours'
      ]
    },
    {
      icon: SparklesIcon,
      title: 'Quality Standards',
      gradient: 'from-blue-500 to-indigo-600',
      content: [
        'Use professional-grade products and equipment',
        'Maintain clean and hygienic work environment',
        'Follow industry best practices and safety protocols',
        'Continuously update skills through education',
        'Deliver services that match or exceed descriptions'
      ]
    },
    {
      icon: ClockIcon,
      title: 'Cancellation Policy',
      gradient: 'from-indigo-500 to-purple-600',
      content: [
        'Clients can cancel free of charge up to 24 hours before',
        'Late cancellations may result in partial charges',
        'Stylists must honor confirmed bookings',
        'Emergency cancellations require documentation',
        'Repeated cancellations may affect account standing'
      ]
    },
    {
      icon: CheckCircleIcon,
      title: 'Verification Process',
      gradient: 'from-purple-500 to-pink-600',
      content: [
        'Submit valid government-issued ID',
        'Provide proof of professional certifications',
        'Complete background check (where applicable)',
        'Verify work location and contact information',
        'Approval typically takes 2-3 business days'
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: 'Client Safety',
      gradient: 'from-pink-500 to-red-600',
      content: [
        'Strict hygiene and sanitation protocols required',
        'Proper disposal of single-use items',
        'Safe handling and storage of products',
        'Immediate reporting of any safety incidents',
        'Compliance with local health regulations'
      ]
    }
  ];

  const highlights = [
    { label: 'Verified Stylists', value: '100%', gradient: 'from-green-500 to-emerald-600' },
    { label: 'Safety Compliance', value: '5-Star', gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Client Satisfaction', value: '4.8/5', gradient: 'from-purple-500 to-pink-600' }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="Professional Policies"
        subtitle="Guidelines and standards for BeautyCita stylists"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-80"
      />

      {/* Introduction */}
      <section className="container mx-auto px-4 max-w-4xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GradientCard gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10" isDarkMode={isDarkMode}>
            <div className="flex items-start space-x-4">
              <ShieldCheckIcon className="h-10 w-10 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Our Commitment to Excellence
                </h2>
                <p className={`leading-relaxed mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  At BeautyCita, we maintain the highest standards of professionalism and safety. Our policies
                  ensure that both clients and stylists have the best possible experience on our platform.
                </p>
                <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  All stylists must adhere to these policies to maintain their verified status and continue
                  serving clients through BeautyCita.
                </p>
              </div>
            </div>
          </GradientCard>
        </motion.div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 max-w-6xl pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard gradient={`${highlight.gradient}/10`} isDarkMode={isDarkMode}>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 bg-gradient-to-r ${highlight.gradient} bg-clip-text text-transparent`}>
                    {highlight.value}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {highlight.label}
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Policies */}
      <section className="container mx-auto px-4 max-w-6xl pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Stylist Policies
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Guidelines every stylist must follow
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {policies.map((policy, index) => (
            <motion.div
              key={policy.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={`${policy.gradient}/10`}
                isDarkMode={isDarkMode}
                className="h-full"
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className={`p-3 rounded-3xl bg-gradient-to-r ${policy.gradient} flex-shrink-0`}>
                    <policy.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold pt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {policy.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {policy.content.map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-start space-x-3 text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      <CheckCircleIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-500'
                      }`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Important Note */}
      <section className="container mx-auto px-4 max-w-4xl pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <GradientCard gradient="from-yellow-500/10 to-orange-500/10" isDarkMode={isDarkMode}>
            <div className="flex items-start space-x-4">
              <ShieldCheckIcon className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Policy Violations
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Violations of these policies may result in warnings, temporary suspension, or permanent removal
                  from the BeautyCita platform. We take the safety and satisfaction of our community seriously.
                  If you have questions about any policy, please contact our support team.
                </p>
              </div>
            </div>
          </GradientCard>
        </motion.div>
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
          <ShieldCheckIcon className="h-16 w-16 text-white/90 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join Our Verified Stylists?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Become part of our community of professional beauty experts committed to excellence.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-3xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
            Apply for Verification
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default PoliciesPage;
