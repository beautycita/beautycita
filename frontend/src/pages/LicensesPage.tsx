import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { DocumentTextIcon, CodeBracketIcon, HeartIcon } from '@heroicons/react/24/outline'

const LicensesPage: React.FC = () => {
  const { i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const licenses = [
    { name: 'React', version: '18.x', license: 'MIT', url: 'https://github.com/facebook/react' },
    { name: 'React Router', version: '6.x', license: 'MIT', url: 'https://github.com/remix-run/react-router' },
    { name: 'TypeScript', version: '5.x', license: 'Apache 2.0', url: 'https://github.com/microsoft/TypeScript' },
    { name: 'Vite', version: '5.x', license: 'MIT', url: 'https://github.com/vitejs/vite' },
    { name: 'Tailwind CSS', version: '3.x', license: 'MIT', url: 'https://github.com/tailwindlabs/tailwindcss' },
    { name: 'Framer Motion', version: '11.x', license: 'MIT', url: 'https://github.com/framer/motion' },
    { name: 'Heroicons', version: '2.x', license: 'MIT', url: 'https://github.com/tailwindlabs/heroicons' },
    { name: 'i18next', version: '23.x', license: 'MIT', url: 'https://github.com/i18next/i18next' },
    { name: 'React i18next', version: '14.x', license: 'MIT', url: 'https://github.com/i18next/react-i18next' },
    { name: 'Axios', version: '1.x', license: 'MIT', url: 'https://github.com/axios/axios' },
    { name: 'Express', version: '4.x', license: 'MIT', url: 'https://github.com/expressjs/express' },
    { name: 'Node.js', version: '20.x', license: 'MIT', url: 'https://github.com/nodejs/node' },
    { name: 'PostgreSQL', version: '16.x', license: 'PostgreSQL License', url: 'https://www.postgresql.org/' },
    { name: 'Sequelize', version: '6.x', license: 'MIT', url: 'https://github.com/sequelize/sequelize' },
    { name: 'Stripe Node', version: '14.x', license: 'MIT', url: 'https://github.com/stripe/stripe-node' },
    { name: 'PayPal SDK', version: '2.x', license: 'Apache 2.0', url: 'https://github.com/paypal/Checkout-NodeJS-SDK' },
    { name: 'BTCPay Server', version: '1.x', license: 'MIT', url: 'https://github.com/btcpayserver/btcpayserver' },
    { name: 'Socket.io', version: '4.x', license: 'MIT', url: 'https://github.com/socketio/socket.io' },
    { name: 'Redis', version: '7.x', license: 'BSD 3-Clause', url: 'https://github.com/redis/redis' },
    { name: 'Nginx', version: '1.24.x', license: 'BSD 2-Clause', url: 'https://nginx.org/' },
    { name: 'Docker', version: '24.x', license: 'Apache 2.0', url: 'https://www.docker.com/' },
    { name: 'Jest', version: '29.x', license: 'MIT', url: 'https://github.com/facebook/jest' },
    { name: 'React Testing Library', version: '14.x', license: 'MIT', url: 'https://github.com/testing-library/react-testing-library' },
    { name: 'Puppeteer', version: '21.x', license: 'Apache 2.0', url: 'https://github.com/puppeteer/puppeteer' },
    { name: 'Winston', version: '3.x', license: 'MIT', url: 'https://github.com/winstonjs/winston' },
    { name: 'Joi', version: '17.x', license: 'BSD 3-Clause', url: 'https://github.com/hapijs/joi' },
    { name: 'bcryptjs', version: '2.x', license: 'MIT', url: 'https://github.com/dcodeIO/bcrypt.js' },
    { name: 'jsonwebtoken', version: '9.x', license: 'MIT', url: 'https://github.com/auth0/node-jsonwebtoken' },
    { name: 'Passport.js', version: '0.7.x', license: 'MIT', url: 'https://github.com/jaredhanson/passport' },
    { name: 'Nodemailer', version: '6.x', license: 'MIT', url: 'https://github.com/nodemailer/nodemailer' }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <CodeBracketIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Licencias de Código Abierto' : 'Open Source Licenses'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {i18n.language === 'es'
                ? 'BeautyCita está construido con tecnologías de código abierto increíbles'
                : 'BeautyCita is built with amazing open source technologies'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <HeartIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={`text-3xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Agradecimiento' : 'Acknowledgment'}
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {i18n.language === 'es'
                  ? 'Construido sobre los hombros de gigantes del código abierto'
                  : 'Standing on the shoulders of open source giants'}
              </p>
            </div>
          </div>

          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p>
              {i18n.language === 'es'
                ? 'BeautyCita no sería posible sin el increíble trabajo de miles de desarrolladores de código abierto en todo el mundo. Esta página reconoce y agradece a todos los proyectos que utilizamos.'
                : 'BeautyCita would not be possible without the incredible work of thousands of open source developers worldwide. This page acknowledges and thanks all the projects we use.'}
            </p>
            <p>
              {i18n.language === 'es'
                ? 'Cumplimos totalmente con todas las licencias de código abierto y respetamos los derechos de los autores originales. Si tienes alguna pregunta sobre nuestro uso de un proyecto en particular, por favor contáctanos.'
                : 'We fully comply with all open source licenses and respect the rights of original authors. If you have any questions about our use of a particular project, please contact us.'}
            </p>
          </div>
        </motion.section>

        {/* Licenses Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <h2 className={`text-3xl font-serif font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Bibliotecas y Tecnologías' : 'Libraries and Technologies'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {licenses.map((lib, index) => (
              <motion.div
                key={lib.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.02 }}
                className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-all cursor-pointer`}
                onClick={() => window.open(lib.url, '_blank')}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {lib.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                    {lib.version}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {lib.license}
                  </span>
                  <DocumentTextIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
              </motion.div>
            ))}
          </div>

          <p className={`text-sm text-center mt-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {i18n.language === 'es'
              ? 'Haz clic en cualquier tarjeta para ver el repositorio original'
              : 'Click any card to view the original repository'}
          </p>
        </motion.section>

        {/* License Types */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              MIT {i18n.language === 'es' ? 'Licencia' : 'License'}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {i18n.language === 'es'
                ? 'Licencia permisiva que permite uso, modificación y distribución con mínimas restricciones.'
                : 'Permissive license allowing use, modification, and distribution with minimal restrictions.'}
            </p>
            <div className={`mt-4 text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent`}>
              {licenses.filter(l => l.license === 'MIT').length} {i18n.language === 'es' ? 'bibliotecas' : 'libraries'}
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Apache 2.0
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {i18n.language === 'es'
                ? 'Licencia permisiva con protección de patentes y responsabilidad limitada.'
                : 'Permissive license with patent protection and limited liability.'}
            </p>
            <div className={`mt-4 text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent`}>
              {licenses.filter(l => l.license === 'Apache 2.0').length} {i18n.language === 'es' ? 'bibliotecas' : 'libraries'}
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              BSD {i18n.language === 'es' ? 'Licencias' : 'Licenses'}
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {i18n.language === 'es'
                ? 'Familia de licencias permisivas con requisitos mínimos de atribución.'
                : 'Family of permissive licenses with minimal attribution requirements.'}
            </p>
            <div className={`mt-4 text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent`}>
              {licenses.filter(l => l.license.includes('BSD')).length} {i18n.language === 'es' ? 'bibliotecas' : 'libraries'}
            </div>
          </div>
        </motion.section>

        {/* Full License Text */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`mt-12 rounded-2xl p-8 ${isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}
        >
          <div className="text-center">
            <DocumentTextIcon className="h-16 w-16 mx-auto mb-6 text-pink-600" />
            <h2 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {i18n.language === 'es' ? '¿Necesitas Textos Completos de Licencias?' : 'Need Full License Texts?'}
            </h2>
            <p className={`text-lg mb-8 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {i18n.language === 'es'
                ? 'Los textos completos de todas las licencias están disponibles en nuestro repositorio de código fuente.'
                : 'Full texts of all licenses are available in our source code repository.'}
            </p>
            <a
              href="https://github.com/beautycita/beautycita"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {i18n.language === 'es' ? 'Ver en GitHub' : 'View on GitHub'}
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default LicensesPage
