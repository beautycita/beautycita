import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  BellAlertIcon,
  CheckBadgeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  BookOpenIcon,
  KeyIcon
} from '@heroicons/react/24/outline'
import PageHero from '../components/ui/PageHero'

const StylistGuidePage: React.FC = () => {
  const { t } = useTranslation()

  const sections = [
    {
      icon: BellAlertIcon,
      title: 'Notifications & Alerts',
      color: 'from-pink-500 to-rose-500',
      items: [
        'Enable push notifications on all your devices',
        'Turn up notification volume to maximum to avoid missing alerts',
        'Check notification permissions in your device settings',
        'Keep BeautyCita app open or in background for real-time alerts',
        'Respond to booking requests within 15 minutes for best results',
        'Enable SMS notifications as a backup',
      ]
    },
    {
      icon: CheckBadgeIcon,
      title: 'Getting Started',
      color: 'from-purple-500 to-indigo-500',
      items: [
        'Complete your profile with professional photos',
        'Add your services with accurate pricing and duration',
        'Set your availability calendar for upcoming weeks',
        'Upload portfolio photos showcasing your best work',
        'Complete Stripe Connect onboarding to receive payments',
        'Verify your phone number for SMS notifications',
      ]
    },
    {
      icon: CalendarIcon,
      title: 'Managing Bookings',
      color: 'from-blue-500 to-cyan-500',
      items: [
        'Accept or decline booking requests within 24 hours',
        'Mark bookings as completed after service is finished',
        'Update your calendar immediately when availability changes',
        'Communicate clearly with clients through messages',
        'Arrive on time or notify clients of any delays',
        'Request reviews after successful appointments',
      ]
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Payments & Revenue',
      color: 'from-emerald-500 to-teal-500',
      items: [
        'Payments are automatically processed through Stripe',
        'Platform fee: 15% per booking (covers payment processing)',
        'Payouts arrive in your bank account within 2-7 days',
        'Track your revenue in the Finance dashboard',
        'Issue refunds through the dispute resolution system',
        'Keep your bank information up to date in Stripe',
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: 'Rules & Regulations',
      color: 'from-orange-500 to-amber-500',
      items: [
        'Provide services exactly as described in your listings',
        'Maintain professional conduct at all times',
        'Respect client privacy and data protection laws',
        'Report any issues or disputes within 48 hours',
        'Do not request off-platform payments',
        'Cancel appointments only in emergencies',
        'Maintain valid licenses and certifications',
      ]
    },
    {
      icon: LightBulbIcon,
      title: 'Tips for Success',
      color: 'from-pink-500 to-purple-500',
      items: [
        'High-quality portfolio photos increase booking rates by 70%',
        'Respond to messages within 1 hour for better ratings',
        'Offer package deals to encourage repeat bookings',
        'Ask satisfied clients to leave reviews',
        'Keep your calendar updated to avoid conflicts',
        'Build relationships with clients for long-term success',
        'Upsell additional services during appointments',
      ]
    },
    {
      icon: KeyIcon,
      title: 'Platform Shortcuts',
      color: 'from-violet-500 to-fuchsia-500',
      items: [
        'Dashboard: Quick overview of bookings and revenue',
        'Calendar: Drag-and-drop to reschedule appointments',
        'Services: Edit pricing and availability on-the-fly',
        'Messages: Bulk reply to multiple clients',
        'Portfolio: Reorder photos by drag-and-drop',
        'Analytics: Track performance metrics weekly',
        'Settings: Update notification preferences anytime',
      ]
    },
    {
      icon: BookOpenIcon,
      title: 'Resources & Support',
      color: 'from-indigo-500 to-blue-500',
      items: [
        'Help Center: Detailed guides and FAQs',
        'Video Tutorials: Step-by-step platform walkthrough',
        'Community Forum: Connect with other stylists',
        'Support Team: Available 9 AM - 6 PM PST weekdays',
        'Email: support@beautycita.com',
        'Phone: Available for urgent issues',
        'Knowledge Base: Search for specific topics',
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <PageHero
        title="Stylist Handbook"
        description="Everything you need to know to succeed on BeautyCita"
        size="medium"
      />

      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Welcome to BeautyCita! This comprehensive guide will help you maximize your success
            on our platform. Follow these best practices to grow your business and provide
            exceptional service to your clients.
          </p>
        </motion.div>

        {/* Sections Grid */}
        <div className="space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${section.color} p-6`}>
                <div className="flex items-center gap-4">
                  <section.icon className="w-10 h-10 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    {section.title}
                  </h2>
                </div>
              </div>

              <div className="p-8">
                <ul className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <div className={`mt-1 w-6 h-6 rounded-full bg-gradient-to-r ${section.color} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">
                          {itemIndex + 1}
                        </span>
                      </div>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sections.length * 0.1 }}
          className="mt-16 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Need More Help?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Our support team is here to help you succeed. Contact us anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/contact"
              className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/help"
              className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold hover:bg-white/30 transition-colors"
            >
              Visit Help Center
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default StylistGuidePage
