import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  SparklesIcon,
  HeartIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import {
  GlobeAltIcon as FacebookIcon,
  AtSymbolIcon as TwitterIcon,
  CameraIcon as InstagramIcon,
  LinkIcon as LinkedInIcon
} from '@heroicons/react/24/solid'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const authToken = localStorage.getItem('beautycita-auth-token')
    setIsAuthenticated(!!authToken)
  }, [])

  const footerLinks = {
    company: [
      { name: t('footer.company.careers'), href: '/careers' },
      { name: t('footer.company.press'), href: '/press' },
      { name: t('footer.company.blog'), href: '/blog' },
    ],
    support: [
      { name: t('footer.support.helpCenter'), href: '/help' },
      { name: t('nav.contact'), href: '/contact' },
      { name: t('footer.support.serviceStatus'), href: '/status' },
      { name: t('footer.support.reportProblem'), href: '/report' },
    ],
    legal: [
      { name: t('footer.legal.privacy'), href: '/privacy' },
      { name: t('footer.legal.terms'), href: '/terms' },
      { name: t('footer.legal.cookies'), href: '/cookies' },
      { name: t('footer.legal.licenses'), href: '/licenses' },
    ],
    stylists: [
      { name: t('footer.stylists.joinStylist'), href: '/stylist-application' },
      { name: t('footer.stylists.resources'), href: '/resources' },
      { name: t('footer.stylists.policies'), href: '/policies' },
      { name: t('footer.stylists.commissions'), href: '/commissions' },
    ]
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubscribing(true)
    setSubscriptionStatus('idle')
    setStatusMessage('')

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscriptionStatus('success')
        setStatusMessage(data.message || 'Successfully subscribed!')
        setEmail('')
        setTimeout(() => {
          setSubscriptionStatus('idle')
          setStatusMessage('')
        }, 5000)
      } else {
        throw new Error(data.message || 'Subscription failed')
      }
    } catch (error) {
      setSubscriptionStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Error subscribing. Please try again.')
      setTimeout(() => {
        setSubscriptionStatus('idle')
        setStatusMessage('')
      }, 5000)
    } finally {
      setIsSubscribing(false)
    }
  }

  const socialLinks = [
    //     { name: 'Facebook', href: 'https://facebook.com/beautycita', icon: FacebookIcon },
    //     { name: 'Twitter', href: 'https://twitter.com/beautycita', icon: TwitterIcon },
    //     { name: 'Instagram', href: 'https://instagram.com/beautycita', icon: InstagramIcon },
    //     { name: 'LinkedIn', href: 'https://linkedin.com/company/beautycita', icon: LinkedInIcon },
  ]

  return (
    <>
      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
        {/* Top Drop Shadow - Universal across app */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none" />

        {/* Main Background - ensure it extends beyond viewport */}
        <div className={`relative pb-safe ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900'}`}>
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-3xl blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 to-purple-600/10 rounded-3xl blur-3xl" />
          </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          {/* Main Footer Content */}
          <div className="pt-16 pb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="col-span-2">
              <Link to="/" className="inline-flex items-center space-x-2 mb-6 group" aria-label={t('footer.logoAriaLabel')}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-3xl">
                    <SparklesIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                </motion.div>
                <span className="text-2xl font-serif font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  BeautyCita
                </span>
              </Link>

              <p className="text-gray-300 mb-6 max-w-xs leading-relaxed text-sm">
                {t('footer.description')}
              </p>

              {/* Social Links */}
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-3xl transition-colors"
                    aria-label={t(`footer.socialAriaLabel.${social.name.toLowerCase()}`)}
                  >
                    <social.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {t('footer.companyTitle')}
              </h3>
              <ul className="space-y-2.5">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-pink-400 transition-all text-sm inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {t('footer.supportTitle')}
              </h3>
              <ul className="space-y-2.5">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-purple-400 transition-all text-sm inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                {t('footer.legalTitle')}
              </h3>
              <ul className="space-y-2.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-blue-400 transition-all text-sm inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conditional: Newsletter for visitors, Stylists column for authenticated */}
            {!isAuthenticated ? (
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                  {t('footer.newsletter.title')}
                </h3>
                <div className="space-y-2.5">
                  <p className="text-gray-300 text-xs">
                    {t('footer.newsletter.subtitle')}
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="space-y-2.5">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('footer.newsletter.placeholder')}
                      className="w-full px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm placeholder-white/60 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all"
                      disabled={isSubscribing}
                      aria-label={t('footer.newsletter.emailAriaLabel')}
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing}
                      className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold rounded-3xl hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
                      aria-label={t('footer.newsletter.subscribeAriaLabel')}
                    >
                      {isSubscribing ? t('footer.newsletter.subscribing') : t('footer.newsletter.subscribe')}
                    </button>
                    {subscriptionStatus !== 'idle' && (
                      <div className={`flex items-center space-x-1 text-xs ${
                        subscriptionStatus === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {subscriptionStatus === 'success' ? (
                          <CheckCircleIcon className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ExclamationCircleIcon className="h-3 w-3" aria-hidden="true" />
                        )}
                        <span>{statusMessage}</span>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
                  {t('footer.stylistsTitle')}
                </h3>
                <ul className="space-y-2.5">
                  {footerLinks.stylists.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-gray-300 hover:text-pink-400 transition-all text-sm inline-block"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="py-4 border-t border-white/10">
            <div className="text-gray-400 text-sm text-center">
              <p className="flex items-center justify-center gap-2">
                {t('footer.copyright', { year: currentYear })}
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1">
                  {t('footer.madeWith')} <HeartIcon className="h-4 w-4 text-pink-500 animate-pulse" aria-hidden="true" /> {t('footer.inMexico')}
                </span>
              </p>
            </div>
          </div>
        </div>
        </div>
      </footer>
    </>
  )
}
