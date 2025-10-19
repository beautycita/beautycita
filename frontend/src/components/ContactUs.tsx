import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiClient } from '../services/api'

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'client'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await apiClient.post('/contact', formData)

      if (response.success) {
        setSubmitMessage('Thank you for your message! We\'ll get back to you within 24 hours.')
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          userType: 'client'
        })
      } else {
        setSubmitMessage('Sorry, there was an error sending your message. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setSubmitMessage('Sorry, there was an error sending your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get help via email',
      details: 'support@beautycita.com',
      subtext: 'Response within 24 hours'
    },
    {
      icon: '📱',
      title: 'Phone Support',
      description: 'Talk to our team',
      details: '+1 (555) 123-4567',
      subtext: 'Mon-Fri, 9AM-6PM PST'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Instant assistance',
      details: 'Available in app',
      subtext: 'Mon-Fri, 9AM-9PM PST'
    },
    {
      icon: '🏢',
      title: 'Office Address',
      description: 'Visit us in person',
      details: '123 Beauty Street, Los Angeles, CA 90210',
      subtext: 'By appointment only'
    }
  ]

  const faqItems = [
    {
      question: 'How do I book an appointment?',
      answer: 'Simply create an account, browse our verified beauty professionals, and book directly through the app with instant confirmation.'
    },
    {
      question: 'What if I need to cancel or reschedule?',
      answer: 'You can cancel or reschedule up to 24 hours before your appointment through the app without any fees.'
    },
    {
      question: 'How do payments work?',
      answer: 'We use Stripe for secure payment processing. Payment is processed when you book, and stylists receive payment after service completion.'
    },
    {
      question: 'How do I become a stylist on BeautyCita?',
      answer: 'Apply through our stylist registration process. You\'ll need to verify your license and complete our onboarding program.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4 max-w-6xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Contact Us
          </h1>
          <p className="text-gray-600">
            We're here to help with any questions or concerns
          </p>
        </div>
      </div>

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Contact Methods */}
        <motion.div
          className="mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
            Get in Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="text-3xl mb-3">{method.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{method.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                <p className="text-gray-800 font-medium mb-1">{method.details}</p>
                <p className="text-gray-500 text-xs">{method.subtext}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">Send us a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a...
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="client">Client looking for beauty services</option>
                  <option value="stylist">Beauty professional wanting to join</option>
                  <option value="business">Business inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's this about?"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div className={`p-4 rounded-full text-sm ${
                  submitMessage.includes('Thank you')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {submitMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-full font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            className="space-y-6"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>

              <div className="space-y-6">
                {faqItems.map((faq, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Support */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Need Immediate Help?</h3>
              <p className="text-red-700 text-sm mb-3">
                For urgent issues with active bookings or safety concerns:
              </p>
              <div className="space-y-2">
                <p className="text-red-800 font-medium">📞 Emergency Line: +1 (555) 911-HELP</p>
                <p className="text-red-700 text-sm">Available 24/7 for urgent matters</p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-blue-50 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Monday - Friday:</span>
                  <span className="text-blue-800 font-medium">9:00 AM - 6:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Saturday:</span>
                  <span className="text-blue-800 font-medium">10:00 AM - 4:00 PM PST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Sunday:</span>
                  <span className="text-blue-800 font-medium">Closed</span>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-blue-700 text-xs">
                    * Live chat and emergency support available outside business hours
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="px-4 py-6 max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-3">
            © 2025 BeautyCita. All rights reserved.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700 text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms/client" className="text-gray-500 hover:text-gray-700 text-sm">
              Terms of Service
            </Link>
            <Link to="/about" className="text-gray-500 hover:text-gray-700 text-sm">
              About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactUs