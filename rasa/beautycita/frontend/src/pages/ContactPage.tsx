import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  NewspaperIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const contactMethods = [
    {
      icon: EnvelopeIcon,
      title: t('pages.contact.generalInquiries'),
      description: 'For general questions and information',
      contact: 'hello@beautycita.com',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: t('pages.contact.support'),
      description: 'Technical support and account help',
      contact: 'support@beautycita.com',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: UserGroupIcon,
      title: t('pages.contact.partnerships'),
      description: 'Business partnerships and collaborations',
      contact: 'partnerships@beautycita.com',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: NewspaperIcon,
      title: t('pages.contact.press'),
      description: 'Media inquiries and press relations',
      contact: 'press@beautycita.com',
      color: 'from-pink-500 to-pink-600'
    }
  ];

  const officeInfo = {
    address: 'Av. Insurgentes Sur 1234, Colonia del Valle, 03100 Ciudad de México, México',
    phone: '+52 55 1234 5678',
    email: 'hello@beautycita.com',
    hours: {
      weekdays: '9:00 AM - 6:00 PM',
      weekends: '10:00 AM - 4:00 PM'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-600/10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <div className="flex justify-center mb-6">
            <EnvelopeIcon className="h-16 w-16 text-teal-500" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            {t('pages.contact.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            {t('pages.contact.subtitle')}
          </p>
        </motion.div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {t('pages.contact.getInTouch')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${method.color} group-hover:scale-110 transition-transform`}>
                    <method.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                  {method.title}
                </h3>
                <p className="text-gray-600 text-sm text-center mb-3">{method.description}</p>
                <div className="text-center">
                  <a
                    href={`mailto:${method.contact}`}
                    className="text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors"
                  >
                    {method.contact}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('pages.contact.name')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('pages.contact.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="press">Press & Media</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('pages.contact.subject')}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('pages.contact.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full btn bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 py-4"
                >
                  {t('pages.contact.send')}
                </button>
              </form>
            </motion.div>

            {/* Office Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  {t('pages.contact.location')}
                </h2>
                <div className="p-6 rounded-2xl bg-white shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-6 w-6 text-teal-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                        <p className="text-gray-600">{officeInfo.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-6 w-6 text-teal-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                        <a
                          href={`tel:${officeInfo.phone}`}
                          className="text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          {officeInfo.phone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-6 w-6 text-teal-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                        <a
                          href={`mailto:${officeInfo.email}`}
                          className="text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          {officeInfo.email}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <ClockIcon className="h-6 w-6 text-teal-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {t('pages.contact.hours')}
                        </h3>
                        <div className="text-gray-600 space-y-1">
                          <p>Monday - Friday: {officeInfo.hours.weekdays}</p>
                          <p>Saturday - Sunday: {officeInfo.hours.weekends}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPinIcon className="h-12 w-12 text-teal-600 mx-auto mb-2" />
                  <p className="text-teal-700 font-medium">Interactive Map</p>
                  <p className="text-teal-600 text-sm">Coming Soon</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-teal-600 to-cyan-600">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center text-white"
        >
          <div className="flex justify-center mb-6">
            <HeartIcon className="h-12 w-12 text-teal-200" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            We're here to help you look and feel your best
          </h2>
          <p className="text-xl mb-8 text-teal-100">
            Whether you have questions about our services, need technical support, or want to partner with us,
            our team is ready to assist you.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default ContactPage;