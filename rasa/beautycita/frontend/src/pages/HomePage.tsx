import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  SparklesIcon,
  StarIcon,
  HeartIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const { t } = useTranslation()

  const features = [
    {
      icon: CalendarDaysIcon,
      title: t('homepage.features.easyBooking.title'),
      description: t('homepage.features.easyBooking.description')
    },
    {
      icon: ShieldCheckIcon,
      title: t('homepage.features.verifiedStylists.title'),
      description: t('homepage.features.verifiedStylists.description')
    },
    {
      icon: CreditCardIcon,
      title: t('homepage.features.securePayments.title'),
      description: t('homepage.features.securePayments.description')
    },
    {
      icon: StarIcon,
      title: t('homepage.features.realReviews.title'),
      description: t('homepage.features.realReviews.description')
    }
  ]

  const services = [
    {
      name: t('homepage.services.haircut'),
      image: '/images/haircut.jpg',
      price: `${t('homepage.services.from')} $300`,
      popular: true
    },
    {
      name: t('homepage.services.coloring'),
      image: '/images/coloring.jpg',
      price: `${t('homepage.services.from')} $800`
    },
    {
      name: t('homepage.services.manicure'),
      image: '/images/manicure.jpg',
      price: `${t('homepage.services.from')} $200`
    },
    {
      name: t('homepage.services.makeup'),
      image: '/images/makeup.jpg',
      price: `${t('homepage.services.from')} $400`
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative hero-gradient section-padding overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container-responsive relative z-10">
          <div className="text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <SparklesIcon className="h-16 w-16 animate-sparkle" />
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-balance">
                {t('homepage.hero.title')}
                <span className="block neon-text bg-gradient-to-r from-neon-pink to-beauty-cyber bg-clip-text text-transparent animate-pulse">{t('homepage.hero.subtitle')}</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto text-balance">
                {t('homepage.hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                <Link
                  to="/services"
                  className="btn btn-lg bg-gradient-tiktok text-white hover:scale-105 transform transition-all duration-300 shadow-neon animate-glow border-0"
                >
                  {t('homepage.hero.exploreServices')}
                </Link>
                <Link
                  to="/register/stylist"
                  className="btn btn-lg genz-card text-white hover:scale-105 transform transition-all duration-300 border border-white/30 hover:shadow-neon-pink"
                >
                  {t('homepage.hero.joinStylist')}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-10 w-20 h-20 bg-neon-pink/20 rounded-full blur-xl animate-glow"
          />
          <motion.div
            animate={{
              y: [0, 30, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 right-20 w-32 h-32 bg-beauty-cyber/30 rounded-full blur-xl animate-pulse"
          />
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/4 w-16 h-16 bg-beauty-violet/25 rounded-full blur-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-gradient-to-br from-gray-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-genz opacity-10"></div>
        <div className="container-responsive relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 animate-float">
              {t('homepage.features.title')}
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {t('homepage.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 genz-card rounded-2xl mb-6 group-hover:shadow-neon transition-all duration-300 animate-float">
                  <feature.icon className="h-8 w-8 text-beauty-cyber group-hover:text-neon-pink transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-beauty-peach transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-white/70 group-hover:text-white/90 transition-colors duration-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="section-padding bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 neon-text">
              {t('homepage.services.title')}
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {t('homepage.services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="genz-card group cursor-pointer hover:shadow-neon-pink transition-all duration-300 hover:scale-105 border border-white/20"
              >
                {service.popular && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="badge bg-gradient-tiktok text-white border-0 animate-pulse">{t('homepage.services.popular')}</span>
                  </div>
                )}

                <div className="relative h-48 bg-gradient-sunset rounded-t-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute bottom-4 right-4">
                    <HeartIcon className="h-6 w-6 text-white/80 group-hover:text-neon-pink transition-colors duration-300 animate-pulse" />
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-beauty-peach transition-colors duration-300">
                    {service.name}
                  </h3>
                  <p className="text-beauty-cyber font-semibold group-hover:text-neon-pink transition-colors duration-300">
                    {service.price}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/services"
              className="btn btn-lg bg-gradient-cyber text-white hover:scale-105 transform transition-all duration-300 shadow-neon border-0 animate-glow"
            >
              {t('homepage.services.viewAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary-600">
        <div className="container-responsive">
          <div className="text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold">
                {t('homepage.cta.title')}
              </h2>
              <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                {t('homepage.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/register"
                  className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
                >
                  {t('homepage.cta.createAccount')}
                </Link>
                <Link
                  to="/stylists"
                  className="btn btn-lg bg-transparent border-white text-white hover:bg-white/10"
                >
                  {t('homepage.cta.findStylists')}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                10K+
              </div>
              <div className="text-lg text-gray-300">
                {t('homepage.stats.happyClients')}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-bold text-secondary-400 mb-2">
                500+
              </div>
              <div className="text-lg text-gray-300">
                {t('homepage.stats.verifiedStylists')}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-bold text-pink-400 mb-2">
                4.9★
              </div>
              <div className="text-lg text-gray-300">
                {t('homepage.stats.averageRating')}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}