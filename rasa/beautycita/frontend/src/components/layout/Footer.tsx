import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  SparklesIcon,
  HeartIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
// Social media icons (using placeholder icons for now)
import {
  GlobeAltIcon as FacebookIcon,
  AtSymbolIcon as TwitterIcon,
  CameraIcon as InstagramIcon,
  LinkIcon as LinkedInIcon
} from '@heroicons/react/24/solid'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation()

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const footerLinks = {
    company: [
      { name: t('nav.about'), href: '/about' },
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
      { name: t('footer.stylists.joinStylist'), href: '/register/stylist' },
      { name: t('footer.stylists.resources'), href: '/resources' },
      { name: t('footer.stylists.policies'), href: '/policies' },
      { name: t('footer.stylists.commissions'), href: '/commissions' },
    ]
  }

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: FacebookIcon },
    { name: 'Twitter', href: '#', icon: TwitterIcon },
    { name: 'Instagram', href: '#', icon: InstagramIcon },
    { name: 'LinkedIn', href: '#', icon: LinkedInIcon },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-responsive py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <SparklesIcon className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-serif font-bold text-white">
                BeautyCita
              </span>
            </Link>

            <p className="text-gray-300 mb-6 max-w-md">
              {t('footer.description')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <EnvelopeIcon className="h-4 w-4 text-primary-400" />
                <span>hola@beautycita.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <PhoneIcon className="h-4 w-4 text-primary-400" />
                <span>+52 55 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <MapPinIcon className="h-4 w-4 text-primary-400" />
                <span>Ciudad de México, México</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Estilistas</h3>
            <ul className="space-y-2">
              {footerLinks.stylists.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    onClick={scrollToTop}
                    className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="mb-6 lg:mb-0">
              <h3 className="text-lg font-semibold mb-2">
                {t('footer.newsletter.title')}
              </h3>
              <p className="text-gray-300 text-sm">
                {t('footer.newsletter.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder={t('footer.newsletter.placeholder')}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 flex-1 lg:w-64"
              />
              <button className="btn btn-primary whitespace-nowrap">
                {t('footer.newsletter.subscribe')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4 md:mb-0">
              <span>© {currentYear} BeautyCita.</span>
              <span>{t('footer.madeWith')}</span>
              <HeartIcon className="h-4 w-4 text-red-400" />
              <span>{t('footer.inMexico')}</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Element */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-secondary-600/10"></div>
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary-400/20 to-transparent"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-secondary-400/20 to-transparent"></div>
      </div>
    </footer>
  )
}