import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  NewspaperIcon,
  HeartIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { PageHero, GradientCard } from '../components/ui'
import { apiClient } from '../services/api'
import toast from 'react-hot-toast'

const ContactPage: React.FC = () => {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await apiClient.post('/contact', {
        ...formData,
        userType: formData.inquiryType
      })

      if (response.success) {
        toast.success(t('contact.success', 'Message sent successfully! We\'ll get back to you soon.'))
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          inquiryType: 'general'
        })
      } else {
        toast.error(t('contact.error', 'Failed to send message. Please try again.'))
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast.error(t('contact.error', 'Failed to send message. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactMethods = [
    {
      icon: EnvelopeIcon,
      title: t('pages.contact.generalInquiries'),
      description: 'For general questions and information',
      contact: 'hello@beautycita.com',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: t('pages.contact.support'),
      description: 'Technical support and account help',
      contact: 'support@beautycita.com',
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: UserGroupIcon,
      title: t('pages.contact.partnerships'),
      description: 'Business partnerships and collaborations',
      contact: 'partnerships@beautycita.com',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: NewspaperIcon,
      title: t('pages.contact.press'),
      description: 'Media inquiries and press relations',
      contact: 'press@beautycita.com',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const officeInfo = {
    address: 'Plaza Caracol local 27 Puerto Vallarta Jalisco Mexico',
    phone: '+527206777800',
    email: 'hello@beautycita.com',
    hours: {
      weekdays: '9:00 AM - 6:00 PM',
      weekends: '10:00 AM - 4:00 PM'
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title={t('pages.contact.title')}
        subtitle={t('pages.contact.subtitle')}
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-96"
      />

      {/* Contact Methods */}
      <section className="container mx-auto px-4 max-w-7xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('pages.contact.getInTouch')}
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Choose the best way to reach us
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient={method.gradient}
                isDarkMode={isDarkMode}
                hoverable={true}
                delay={index * 0.05}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-full bg-gradient-to-br ${method.gradient}`}>
                      <method.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {method.title}
                  </h3>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {method.description}
                  </p>
                  <a
                    href={`mailto:${method.contact}`}
                    className="text-sm font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hover:from-pink-700 hover:to-purple-700 transition-all"
                  >
                    {method.contact}
                  </a>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form & Office Info */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <GradientCard
                gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10"
                isDarkMode={isDarkMode}
                hoverable={false}
              >
                <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Send us a message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('pages.contact.name')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-pink-500/50 ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('pages.contact.email')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-pink-500/50 ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inquiryType" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Inquiry Type
                    </label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-pink-500/50 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-200 text-gray-900'
                      }`}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press & Media</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('pages.contact.subject')}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-full border transition-all focus:ring-4 focus:ring-pink-500/50 ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('pages.contact.message')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 rounded-2xl border transition-all focus:ring-4 focus:ring-pink-500/50 resize-none ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                    <span>{isSubmitting ? 'Sending...' : t('pages.contact.send')}</span>
                  </button>
                </form>
              </GradientCard>
            </motion.div>

            {/* Office Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <GradientCard
                gradient="from-purple-500/10 to-blue-500/10"
                isDarkMode={isDarkMode}
                hoverable={false}
              >
                <h2 className={`text-3xl md:text-4xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('pages.contact.location')}
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <MapPinIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Address
                      </h3>
                      <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {officeInfo.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <PhoneIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Phone
                      </h3>
                      <a
                        href={`tel:${officeInfo.phone}`}
                        className="font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hover:from-pink-700 hover:to-purple-700 transition-all"
                      >
                        {officeInfo.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <EnvelopeIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Email
                      </h3>
                      <a
                        href={`mailto:${officeInfo.email}`}
                        className="font-medium bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent hover:from-pink-700 hover:to-purple-700 transition-all"
                      >
                        {officeInfo.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('pages.contact.hours')}
                      </h3>
                      <div className={`space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <p>Monday - Friday: {officeInfo.hours.weekdays}</p>
                        <p>Saturday - Sunday: {officeInfo.hours.weekends}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GradientCard>

              {/* Interactive Map */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3734.0!2d-105.2275!3d20.6098!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x84214563c7eb7e6b%3A0x3e1b9b0c8e6b0c8e!2sPlaza%20Caracol!5e0!3m2!1sen!2smx!4v1699999999999!5m2!1sen!2smx"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="BeautyCita Office Location - Plaza Caracol, Puerto Vallarta"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 max-w-4xl text-center text-white relative z-10"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <HeartIcon className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            We're here to help you look and feel your best
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Whether you have questions about our services, need technical support, or want to partner with us,
            our team is ready to assist you.
          </p>
        </motion.div>
      </section>
    </div>
  )
}

export default ContactPage
